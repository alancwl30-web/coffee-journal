const assert=require('node:assert/strict');
const C=require('./dist/experience-core.js');
const bean={id:'bean-a',_beanProfile:true,title:'A',weight:200};
const record={id:'brew-a',bean:'A',beanId:'bean-a',dose:12.3,water:172.2,temp:86.5,clicks:24,seconds:180,date:'2026-10-29',rating:5,actualTemp:84,actualWater:174,actualSeconds:190,timerSessionId:'s',notes:'good',stages:[{action:'注水',water:172.2,start:'0:00',until:'0:30',next:'指定時間',temp:86.5,actualWater:174,actualTime:'0:35'}]};
assert.equal(C.remaining(bean,[record]),187.7);
assert.equal(C.remaining(bean,[{...record,dose:15}]),185); // Edit replaces the same ID; derived stock never double-debits.
assert.equal(C.remaining({...bean,id:'second-bag'},[record]),200);
assert.equal(C.remaining({...bean,weight:null},[record]),null);
assert.equal(C.remaining({...bean,weight:5},[record]),-7.3);
const recipe=C.recipeFromBrew(record,'recipe-a','My recipe');
assert.equal(recipe.temp,86.5);assert.equal(recipe.water,172.2);assert.equal(recipe.stages[0].actualWater,'');assert(!('rating' in recipe));assert(!('actualSeconds' in recipe));assert.equal(record.stages[0].actualWater,174);
const next=C.rebrew(record);assert.equal(next.beanId,bean.id);assert.equal(next.water,172.2);for(const k of ['id','actualWater','actualSeconds','rating','timerSessionId'])assert(!Object.hasOwn(next,k));assert.equal(next.stages[0].actualWater,'');
const prefs={id:'preferences',_preferences:true,values:{dose:12.3}};
const parts=C.split([bean,record,recipe,prefs]);assert.equal(parts.records.length,1);assert.equal(parts.recipes.length,1);assert.equal(parts.extras.length,2);
assert.equal(C.elapsed({elapsedMs:2000,running:true,startedAt:1000},6000),7000);
assert.equal(C.elapsed({elapsedMs:2000,running:false,startedAt:1000},6000),2000);
const timer=JSON.parse(JSON.stringify({elapsedMs:0,running:true,startedAt:1000}));assert.equal(C.elapsed(timer,121000),120000); // Recovery uses timestamps, never interval ticks.
assert(C.validatePlan(record));assert.throws(()=>C.validatePlan({...record,bean:''}));assert.throws(()=>C.validatePlan({...record,water:200}));assert.throws(()=>C.validatePlan({...record,stages:[]}));assert.throws(()=>C.validatePlan({...record,stages:[{...record.stages[0],until:'bad'}]}));
console.log('Experience: batch stock/edit isolation, type separation, decimal targets, recipe/rebrew cleanup, timer pause/reload and plan validation passed.');
