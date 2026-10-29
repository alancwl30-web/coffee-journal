const assert=require('node:assert/strict');
const {calculateWaterMix:mix,waterMixBatches:batches}=require('./dist/water-mix.js');
const base={mass:200,target:86,hot:100,room:25};
assert.equal(mix(base).hotGrams,162.7);
const corrected=mix({...base,correction:true,potMass:200,potTemp:25});
assert.equal(corrected.hotGrams,182.1);assert.equal(corrected.roomGrams,17.9);
assert.equal(mix({...base,correction:true,potMass:200,potTemp:86}).hotGrams,162.7);
assert(mix({...base,loss:2}).hotGrams>mix(base).hotGrams);
assert.throws(()=>mix({...base,mass:120,target:90,correction:true,potMass:200,potTemp:25}),/熱量不足/);
assert.throws(()=>mix({...base,hot:25}),/必須高於/);
assert.throws(()=>mix({...base,target:101}));assert.throws(()=>mix({...base,loss:NaN}));
assert.throws(()=>mix({...base,correction:true,potMass:NaN,potTemp:25}));
assert.throws(()=>mix({...base,target:25,correction:true,potMass:1000,potTemp:100}),/熱量過高/);
const stages=[{action:'注水',water:60,temp:90},{action:'注水',water:60,temp:90},{action:'等待浸泡',water:0},{action:'注水',water:160,temp:70}];
const grouped=batches(stages,86);assert.deepEqual(grouped.map(b=>[b.mass,b.target,b.stages]),[[120,90,[1,2]],[160,70,[4]]]);
assert.equal(batches(stages,86,'each').length,3);
assert.equal(batches([{action:'注水',water:200,temp:''}],86)[0].target,86);
assert.deepEqual(batches([],86),[]);
assert.throws(()=>batches([{action:'注水',water:0}],86));
// Energy balance, exact rounded total, and no negative water for supported mixes.
for(const mass of [60,120,160,200,280,500])for(const target of [25,70,86,90,95,100])for(const potMass of [50,200,400]){
 try{const r=mix({mass,target,correction:true,potMass,potTemp:25});assert(Math.abs(r.hotGrams+r.roomGrams-mass)<1e-8);assert(r.hotGrams>=0&&r.roomGrams>=0);const energy=r.hotGrams*4.18*(100-target)+r.roomGrams*4.18*(25-target)+potMass*.5*(25-target);assert(Math.abs(energy)<=16)}catch(e){if(e.code==='ERR_ASSERTION')throw e;assert.match(e.message,/熱量不足|熱量過高/)}
}
console.log('Water mixing passed: vessel heat, preheated kettle, extra loss, rounding, impossible targets, stage grouping and fallback temperatures.');
