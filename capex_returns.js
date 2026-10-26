/* Paper Appendix D: USD trillions, GPU count in millions; no network requests. */
(function (root) {
  'use strict';
  const base = Object.freeze({cost:8.7622,rate:10,margin:50,itShare:68,itLife:6,otherLife:20,gpus:79.31196,utilization:100});
  function annuity(rate, years) {
    return rate === 0 ? 1 / years : rate / (-Math.expm1(-years * Math.log1p(rate)));
  }
  function calculate(p) {
    if (!Object.values(p).every(Number.isFinite) || p.cost <= 0 || p.rate < 0 || p.margin <= 0 || p.margin > 100 || p.itShare < 0 || p.itShare > 100 || p.itLife <= 0 || p.otherLife <= 0 || p.gpus <= 0 || p.utilization <= 0 || p.utilization > 100) throw new Error('请填写有效参数；现金流率与利用率须在0%到100%之间，寿命和成本须为正。');
    const r=p.rate/100, s=p.itShare/100;
    const phi=.05122*(1+r)**3+.05122*(1+r)**2+.17561*(1+r)+.72195;
    const capital=p.cost*phi, charge=s*annuity(r,p.itLife)+(1-s)*annuity(r,p.otherLife);
    const cashflow=capital*charge, revenue=cashflow/(p.margin/100);
    return {phi,capital,charge,cashflow,revenue,price:revenue*1e6/(p.gpus*8760*p.utilization/100)};
  }
  const model={base,annuity,calculate};
  if(typeof module!=='undefined'&&module.exports)module.exports=model;
  root.CapexModel=model;
  if(typeof document==='undefined')return;
  const form=document.querySelector('#cr-form');
  if(!form)return;
  function update(){
    const err=document.querySelector('#cr-error');
    try{
      if(!form.checkValidity())throw new Error('请填写范围内的数值；空值不参与计算。');
      const p=Object.fromEntries(Object.keys(base).map(k=>[k,Number(form.elements[k].value)]));
      const m=calculate(p);err.hidden=true;
      document.querySelector('#cr-revenue').textContent=m.revenue.toFixed(3)+' 万亿美元';
      document.querySelector('#cr-cashflow').textContent=m.cashflow.toFixed(3)+' 万亿美元';
      document.querySelector('#cr-price').textContent=m.price.toFixed(2)+' 美元';
      document.querySelector('#cr-capital-note').textContent=`建设期资本化系数 ${m.phi.toFixed(5)}；投产资本基数 ${m.capital.toFixed(3)} 万亿美元；加权年度资本回收系数 ${(m.charge*100).toFixed(2)}%。`;
      const tbody=document.querySelector('#cr-sensitivity');tbody.replaceChildren();
      for(const rate of [5,10,15]){const tr=document.createElement('tr');const th=document.createElement('th');th.scope='row';th.textContent=rate+'%';tr.append(th);
        for(const margin of [33,50,67]){const td=document.createElement('td');td.textContent=calculate({...p,rate,margin}).revenue.toFixed(3);tr.append(td);}tbody.append(tr);}
    }catch(error){err.textContent=error.message;err.hidden=false;
      for(const id of ['cr-revenue','cr-cashflow','cr-price'])document.querySelector('#'+id).textContent='—';
      document.querySelector('#cr-sensitivity').replaceChildren();document.querySelector('#cr-capital-note').textContent='';}
  }
  form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('reset',()=>setTimeout(update,0));update();
  const search=document.querySelector('#cr-search'), cards=[...document.querySelectorAll('.cr-method')], buttons=[...document.querySelectorAll('.cr-filter button')];let tier='all';
  function filter(){const words=search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);let count=0;
    for(const card of cards){card.hidden=!((tier==='all'||card.dataset.tier===tier)&&words.every(w=>card.dataset.search.toLocaleLowerCase().includes(w)));if(!card.hidden)count++;}
    document.querySelector('#cr-count').textContent=`显示 ${count} / ${cards.length} 个模型与测算`;
    document.querySelector('#cr-empty').hidden=count!==0;
  }
  search.addEventListener('input',filter);buttons.forEach(b=>b.addEventListener('click',()=>{tier=b.dataset.tier;buttons.forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',String(x===b));});filter();}));filter();
  document.querySelectorAll('.cr-table a[href^="#model-"]').forEach(a=>a.addEventListener('click',()=>{tier='all';search.value='';buttons.forEach(b=>{b.classList.toggle('on',b.dataset.tier==='all');b.setAttribute('aria-pressed',String(b.dataset.tier==='all'));});filter();}));
})(typeof globalThis==='undefined'?this:globalThis);
