import assert from 'node:assert/strict';
import {emptyState,readState,queueChanges,mergeSnapshot,acknowledge} from './dist/cloud-core.mjs';
let counter=0;const token=()=>`mutation-${++counter}`;
const a={id:'brew-a',bean:'測試豆',dose:12,water:200,date:'2026-10-26T10:00',stages:[{action:'注水',water:200,temp:86}],recipeScale:'{"recipeId":"switch"}',experiment:{label:'磨細兩格'},trialResult:'better'};
let state=queueChanges(emptyState('owner'),[],[a],token);
assert.equal(state.pending[a.id].record.stages[0].temp,86);
state=readState(JSON.stringify(state),'owner');
assert.equal(state.pending[a.id].record.recipeScale,a.recipeScale,'reload restores full pending record');
assert.equal(state.pending[a.id].record.experiment.label,'磨細兩格');
assert.throws(()=>readState(JSON.stringify(state),'someone-else'),'different account cannot load this cache');
const remote={id:'brew-b',data:{bean:'另一裝置新增',date:'2026-10-26T11:00'},pending:false};
state=mergeSnapshot(state,[remote],true);
assert.equal(state.records.length,2,'server record merges without losing local outbox');
const old=state.pending[a.id].token;
const newer={...a,water:210};
state=queueChanges(state,state.records,[newer,...state.records.filter(r=>r.id!==a.id)],token);
const current=state.pending[a.id].token;
state=acknowledge(state,a.id,old);
assert.equal(state.pending[a.id].token,current,'old acknowledgement cannot remove a newer edit');
state=mergeSnapshot(state,[{id:a.id,data:{...a,_syncToken:old},pending:false},remote],true);
assert.equal(state.records.find(r=>r.id===a.id).water,210,'stale server value cannot erase pending newer edit');
state=mergeSnapshot(state,[{id:a.id,data:{...newer,_syncToken:current},pending:true},remote],true);
assert.ok(state.pending[a.id],'optimistic cached write is not server confirmation');
state=mergeSnapshot(state,[{id:a.id,data:{...newer,_syncToken:current},pending:false},remote],true);
assert.equal(Object.keys(state.pending).length,0,'confirmed matching server write clears outbox');
assert.equal(state.records.find(r=>r.id===a.id)._syncToken,undefined);
const preserved=mergeSnapshot(state,[],false);
assert.equal(preserved.records.length,2,'empty cache is not authoritative remote deletion');
const staleTab=queueChanges(state,[newer],[{...newer,notes:'更新'}],token);
assert.ok(staleTab.records.some(r=>r.id==='brew-b'),'stale tab does not remove another device record');
assert.throws(()=>queueChanges(state,[],[{...a,id:'../bad'}],token));
assert.equal(emptyState('another-account').records.length,0);
assert.equal(mergeSnapshot(emptyState('owner'),[{id:'__connection_check',data:{_systemTest:true},pending:false}],true).records.length,0,'diagnostics never count as coffee records');
console.log('Cloud outbox verified: restart recovery, account isolation, concurrent device merge, newer-edit protection, server-only acknowledgement, cache safety and full recipe/trial data.');

// Recipes use the same private per-user outbox and survive brew edits / reloads.
{
 const recipe={id:'recipe-test',_customRecipe:true,title:'Custom',dose:12,water:200,stages:[{action:'注水',water:200}]};
 const brew={id:'brew-test',bean:'Bean',date:'2026-10-29'};
 let s=queueChanges(emptyState('recipe-owner'),[],[recipe,brew],()=> 'recipe-token');
 s=readState(JSON.stringify(s),'recipe-owner');
 assert.equal(s.records.filter(r=>r._customRecipe).length,1);
 s=queueChanges(s,s.records,[{...brew,water:220},recipe],()=> 'brew-token');
 assert.deepEqual(s.records.find(r=>r._customRecipe),recipe);
 assert.equal(emptyState('other-account').records.length,0);
 console.log('Custom recipes: durable queue, reload, brew isolation and account isolation passed.');
}

// Profile/settings metadata stay outside brew statistics and remain in the durable account queue.
{
 const rows=[{id:'bean-profile',_beanProfile:true,title:'Bag 1',weight:200},{id:'preferences',_preferences:true,values:{dose:12.3,water:172.2}},{id:'brew-metadata-test',beanId:'bean-profile',bean:'Bag 1',dose:12.3,actualWater:173.5,actualSeconds:185.1}];
 let local=queueChanges(emptyState('metadata-owner'),[],rows,token);
 local=readState(JSON.stringify(local),'metadata-owner');
 const remote=rows.map(r=>({id:r.id,data:{...r,_syncToken:local.pending[r.id].token},pending:false}));
 const settled=mergeSnapshot(local,remote,true);
 assert.equal(Object.keys(settled.pending).length,0);
 assert.equal(settled.records.filter(r=>!r._beanProfile&&!r._preferences).length,1);
 const edited=queueChanges(settled,settled.records,[{...rows[2],dose:13}],token);
 assert.equal(edited.records.length,3);assert.equal(edited.records.find(r=>r._beanProfile).weight,200);
 assert.equal(emptyState('another-owner').records.length,0);
 console.log('Bean/settings sync: private durable queue, server acknowledgement, brew edits preserve metadata.');
}
