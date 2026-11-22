const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const core=await import('./dist/cloud-core.mjs');const disk=new Map([['slowbrew-v1','COFFEE DATA UNCHANGED']]);let authCallback,snapshotCallback;const writes=[],events={};
 const sdk={auth:{},db:{},onAuthStateChanged:(a,f)=>{authCallback=f},collection:(db,...path)=>path,doc:(db,...path)=>path,serverTimestamp:()=>0,onSnapshot:(p,o,f)=>{snapshotCallback=f;return()=>{}},setDoc:async(path,data)=>{writes.push({path,data})},getDocsFromServer:async()=>({docs:[]})};
 const nav={onLine:false};const context={...core,injectedSdk:sdk,JSON,Error,Map,Set,Promise,crypto:require('node:crypto').webcrypto,navigator:nav,localStorage:{getItem:k=>disk.get(k)||null,setItem:(k,v)=>disk.set(k,v)},window:{addEventListener:(n,f)=>events[n]=f}};
 vm.createContext(context);let code=fs.readFileSync('./dist/matcha-cloud.mjs','utf8').replace(/^import .*\n/,'').replace('export async function connectMatcha','globalThis.connectMatcha=async function').replace("await import('./firebase-sdk.mjs')",'injectedSdk');vm.runInContext(code,context);
 let rows,status;const api=await context.connectMatcha(r=>rows=r,s=>status=s,()=>{});
 authCallback({uid:'A'});assert(api.save({id:'matcha-one',kind:'drink',powder:3}));assert.equal(status.pending,1);assert(disk.get('slowbrew-matcha-cloud-v1:A').includes('matcha-one'));assert.equal(writes.length,0);
 authCallback({uid:'B'});assert.equal(rows.length,0);nav.onLine=true;assert(api.save({id:'matcha-two',kind:'drink',powder:4}));await new Promise(r=>setImmediate(r));assert(writes.every(w=>w.path.join('/')==='users/B/matcha/matcha-two'));
 authCallback({uid:'A'});await new Promise(r=>setImmediate(r));assert(writes.some(w=>w.path.join('/')==='users/A/matcha/matcha-one'));assert.equal(disk.get('slowbrew-v1'),'COFFEE DATA UNCHANGED');
 snapshotCallback({metadata:{fromCache:false},docs:[{id:'matcha-one',data:()=>({_deleted:true}),metadata:{hasPendingWrites:false}}]});assert.equal(rows.length,0);assert.equal(api.save({id:'matcha-one',kind:'drink',powder:8}),false,'deleted entries cannot be resurrected');
 authCallback(null);assert(api.save({id:'matcha-local',kind:'tin',weight:30}));assert(disk.get('slowbrew-matcha-local-v1').includes('matcha-local'));assert.equal(disk.get('slowbrew-v1'),'COFFEE DATA UNCHANGED');
 console.log('Matcha adapter: private collection paths, offline outbox, account switching, server deletion, anonymous storage and unchanged coffee bytes passed.');
})().catch(e=>{console.error(e);process.exit(1)});
