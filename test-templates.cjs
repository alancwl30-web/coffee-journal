const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('dist/kasuya-recipes.js','utf8');
const fragment=code.slice(code.indexOf('const make='),code.indexOf('additions.forEach'));
const ctx={stepDefaults:v=>v,clock:n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
vm.createContext(ctx);vm.runInContext(fragment+';globalThis.templates=additions;',ctx);
assert.equal(ctx.templates.length,4);
for(const r of ctx.templates){
  assert.equal(r.stages.filter(s=>s.action!=='開閥放水').reduce((n,s)=>n+s.water,0),r.water,r.id+' water total');
  let prior=-1;
  for(const s of r.stages){const [m,sec]=s.start.split(':').map(Number),t=m*60+sec;assert.ok(t>=prior,r.id+' chronological stages');prior=t;if(s.water){assert.ok(s.temp>0&&s.temp<=100);assert.ok(s.water>0)}}
  if(r.drinkStyle==='iced')assert.equal(r.ice,100);
  assert.ok(r.author.includes('非官方'));
}
assert.ok(ctx.templates.find(r=>r.id==='kasuya-iced-46').stages.every(s=>s.valve==='開'));
console.log('4 templates verified: totals, timeline, temperatures, ice, reference labels');
