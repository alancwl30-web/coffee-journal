const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {scaleRecipe}=require('./dist/recipe-scale.js');
const context={document:{querySelector:()=>null},localStorage:{getItem:()=>null}};
vm.createContext(context);
const app=fs.readFileSync('dist/app.js','utf8');
vm.runInContext(app.slice(0,app.indexOf('const demo='))+';globalThis.baseRecipes=recipes;',context);
const stageCode=fs.readFileSync('dist/stages.js','utf8');
vm.runInContext(stageCode.slice(stageCode.indexOf('const stepDefaults='),stageCode.indexOf('const oldStepsLabel='))+';globalThis.baseStages=stageRecipes;',context);
const kasuya=fs.readFileSync('dist/kasuya-recipes.js','utf8');
vm.runInContext(kasuya.slice(kasuya.indexOf('const make='),kasuya.indexOf('additions.forEach'))+';globalThis.extraRecipes=additions;',context);
const originals=[...context.baseRecipes,...context.extraRecipes];
const snapshot=JSON.stringify(originals);
for(const recipe of originals){
  const stages=recipe.stages||context.baseStages[recipe.id].map(s=>context.stepDefaults?context.stepDefaults(s):({action:'注水',...s}));
  for(const dose of [1,12,13.7,15,20,40]){
    for(const target of [null,200.1]){
      const r=scaleRecipe(recipe,stages,dose,target);
      assert.equal(Math.round(r.stages.reduce((n,s)=>n+s.water,0)*10),Math.round(r.water*10),'rounding retains total');
      assert.equal(r.ice,Math.round((recipe.ice||0)*dose/recipe.dose*10)/10);
      assert.deepEqual(r.stages.map(s=>[s.start,s.until,s.next,s.valve,s.temp]),stages.map(s=>[s.start,s.until,s.next,s.valve,s.temp]),'clock, valve and temperatures unchanged');
      assert.ok(r.stages.every(s=>s.actualWater===''&&s.actualTime===''));
    }
  }
}
assert.equal(JSON.stringify(originals),snapshot,'original templates unchanged');
const recipe=originals.find(r=>r.id==='46'),stages=context.baseStages['46'].map(s=>({action:'注水',...s}));
assert.deepEqual(Array.from(scaleRecipe(recipe,stages,12).stages,s=>s.water),[36,36,36,36,36]);
const custom=scaleRecipe(recipe,stages,12,200);
assert.equal(custom.water,200);assert.equal(custom.ratioChanged,true);assert.equal(custom.largeChange,true);
for(const bad of [NaN,0,-1,200.1,12.34])assert.throws(()=>scaleRecipe(recipe,stages,bad));
for(const bad of [NaN,0,-1,3001,200.12])assert.throws(()=>scaleRecipe(recipe,stages,12,bad));
assert.throws(()=>scaleRecipe(recipe,[],12));
console.log('Scaling verified across all 7 templates: 84 dose/water combinations, exact totals, ice, unchanged timing/temperatures, immutable originals and invalid inputs.');
