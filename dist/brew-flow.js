// Local form drafts stay separate from saved brews, inventory and the cloud outbox.
function createBrewDraftStore(storage,account){
 const key='slowbrew-form-drafts-v1:'+account;
 function list(){const raw=storage.getItem(key);if(!raw)return [];const state=JSON.parse(raw);if(state.version!==1||state.account!==account||!Array.isArray(state.drafts)||state.drafts.some(d=>!d||typeof d.id!=='string'||!d.fields||typeof d.fields!=='object'||!Array.isArray(d.stages)))throw Error('Invalid draft data');return state.drafts}
 function write(drafts){storage.setItem(key,JSON.stringify({version:1,account,drafts}))}
 return {key,list,save(draft){const rows=list();write([draft,...rows.filter(d=>d.id!==draft.id)])},remove(id){write(list().filter(d=>d.id!==id))}};
}
function brewWaterTotals(steps,target){const total=Math.round(steps.filter(s=>s.action==='注水').reduce((n,s)=>n+Number(s.water||0),0)*10)/10;return {total,target:Number(target),difference:Math.round((Number(target)-total)*10)/10,aligned:Number(target)>0&&Math.abs(total-Number(target))<.05}}
function resizeBrewStages(steps,target,scale){const total=brewWaterTotals(steps,target).total;return scale({dose:1,water:total,ice:0},steps,1,Number(target)).stages.map((s,i)=>({...s,actualWater:steps[i].actualWater??'',actualTime:steps[i].actualTime??'',actualTemp:steps[i].actualTemp??''}))}
if(typeof module!=='undefined')module.exports={createBrewDraftStore,brewWaterTotals,resizeBrewStages};

if(typeof document!=='undefined')(()=>{
 const css=document.createElement('link');css.rel='stylesheet';css.href='brew-flow.css';document.head.append(css);
 const editor=$('#editor'),advanced=form.querySelector('.advanced-brew');
 const fmt=n=>Number(n).toLocaleString('zh-HK',{maximumFractionDigits:1});
 const sticky=document.createElement('section');sticky.className='brew-preparation-summary';sticky.setAttribute('aria-label','沖煮用水摘要');form.querySelector('.dialog-head').after(sticky);
 const alignment=document.createElement('section');alignment.className='brew-water-alignment';form.elements.temp.closest('.fields').after(alignment);
 function updateWaterSummary(){
  const t=brewWaterTotals(stages,form.elements.water.value);
  const totals=`<span>總注水 <b>${esc(form.elements.water.value||'—')}g</b></span><span>分段合計 <b>${fmt(t.total)}g</b></span>`;
  alignment.classList.toggle('mismatch',!t.aligned);alignment.innerHTML=`<div class="water-total-line">${totals}<strong>${t.aligned?'水量一致':'水量未對齊'}</strong></div>${t.aligned?'':`<div class="water-align-actions"><button type="button" data-align-pours>按比例調整各段</button><button type="button" data-align-total>總注水跟分段</button></div><p>溝水份量按目前分段計算，請先對齊水量。</p>`}`;
  let prep;try{prep=window.getCoffeeWaterPreparation?.()||[]}catch{prep=[{error:'請先填妥各段注水量及目標水溫。'}]}
  sticky.innerHTML=`<div class="water-total-line">${totals}${t.aligned?'':`<strong>水量未對齊</strong>`}<button type="button" data-show-mixing>完整溝水設定</button></div><div class="water-sticky-batches">${prep.slice(0,3).map(b=>b.error?`<p class="water-prep-error">${esc(b.error)}</p>`:`<p><b>${fmt(b.target)}°C · ${fmt(b.mass)}g</b><span>熱水 ${fmt(b.hotGrams)}g ＋ 室溫水 ${fmt(b.roomGrams)}g</span></p>`).join('')||'<p>加入注水段落後，即時顯示溝水份量。</p>'}${prep.length>3?'<button type="button" data-show-mixing>查看其餘水溫</button>':''}</div>`;
 }
 form.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-align-pours')){try{stages=resizeBrewStages(stages,Number(form.elements.water.value),scaleRecipe).map(s=>stepDefaults(s));renderStages();window.refreshRecipeWaterMix?.();saveDraft();toast('已按比例調整各段注水。')}catch(error){toast(error.message)}}
  if(b.hasAttribute('data-align-total')){const t=brewWaterTotals(stages,form.elements.water.value);if(!(t.total>=1&&t.total<=3000)){toast('請先填妥各段注水量。');return}form.elements.water.value=t.total;ratio();updateSummary();window.refreshRecipeWaterMix?.();form.dispatchEvent(new Event('input',{bubbles:true}));saveDraft()}
  if(b.hasAttribute('data-show-mixing')){advanced.open=true;form.querySelector('[data-mix-kind="editor"]').scrollIntoView({block:'start',behavior:'smooth'})}
 });
 window.addEventListener('coffee-water-mix-updated',updateWaterSummary);
 // Account-specific, multiple drafts: opening another recipe never overwrites an older draft.
 let account=null,store=null,activeId=null,active=false,opening=false,submitting=false,currentExperiment=null;
 const draftStatus=document.createElement('p');draftStatus.className='form-draft-status';draftStatus.setAttribute('role','status');form.querySelector('.form-bottom').before(draftStatus);
 function listDrafts(){if(!store)return [];try{return store.list()}catch{draftStatus.textContent='未能讀取草稿；現有資料已保留。';return []}}
 function snapshot(){return {id:activeId,fields:Object.fromEntries(new FormData(form)),stages:JSON.parse(JSON.stringify(stages)),waterMode,preset:$('#preset').value,editing,experiment:window.getCoffeeTrial?window.getCoffeeTrial():currentExperiment,advancedOpen:advanced.open,mixOpen:!!form.querySelector('.mix-settings')?.open,savedAt:Date.now()}}
 function saveDraft(){if(!store||!active||opening||submitting||form.classList.contains('recipe-editing'))return;try{store.save(snapshot());draftStatus.textContent='草稿已存喺此裝置';updateDraftBanner()}catch{draftStatus.textContent='未能保存草稿，請保留此畫面或先儲存紀錄。'}}
 function updateDraftBanner(){const existing=$('#brew-draft-entry');if(page!=='home'||!account){existing?.remove();return}const drafts=listDrafts();if(!drafts.length){existing?.remove();return}const chosen=existing?.querySelector('select')?.value;const banner=existing||document.createElement('section');banner.id='brew-draft-entry';banner.className='brew-draft-entry';banner.innerHTML=`<b>未儲存草稿</b><label class="draft-choice"><span>選擇草稿</span><select aria-label="選擇草稿">${drafts.map(d=>`<option translate="no" value="${esc(d.id)}">${esc(d.fields.bean||'未命名咖啡')} · ${esc(d.fields.date||'')}</option>`).join('')}</select></label><button type="button" data-resume-form>繼續填寫</button><button type="button" data-discard-form>放棄草稿</button><small>草稿只存喺此裝置，未計入沖煮記錄。</small>`;if(chosen&&drafts.some(d=>d.id===chosen))banner.querySelector('select').value=chosen;if(!existing)$('#content .page-title').after(banner)}
 const previousRender=render;render=function(){previousRender();updateDraftBanner()};
 const previousOpen=openBrew;openBrew=function(r){saveDraft();opening=true;active=false;try{previousOpen(r);activeId='draft-'+crypto.randomUUID();currentExperiment=r?.experiment||null;active=true;draftStatus.textContent='草稿只存喺此裝置';updateWaterSummary()}finally{opening=false}};
 function resumeDraft(id){const d=listDrafts().find(x=>x.id===id);if(!d)return;if(d.editing&&!records.some(r=>r.id===d.editing)){toast('原紀錄已不存在，未有還原草稿。');return}saveDraft();opening=true;active=false;try{
   previousOpen({...d.fields,stages:d.stages,experiment:d.experiment,...d.editing?{id:d.editing}:{}});
   for(const [k,v]of Object.entries(d.fields))if(form.elements[k])form.elements[k].value=v;
   stages=d.stages.map(s=>stepDefaults(s));waterMode=d.waterMode==='total'?'total':'added';$('#preset').value=d.preset||'';editing=d.editing||null;
   activeId=d.id;currentExperiment=d.experiment||null;active=true;advanced.open=!!d.advancedOpen;form.querySelector('[data-mix-kind="editor"] .mix-settings').open=!!d.mixOpen;
   window.refreshCoffeeExperience?.();window.refreshRecipeScaleSelection?.();renderStages();window.prepareRecipeWaterMix?.(d.fields.waterMix,false);window.refreshRecipeWaterMix?.();ratio();form.dispatchEvent(new Event('input',{bubbles:true}));draftStatus.textContent='已還原草稿';
  }finally{opening=false}}
 const discard=document.createElement('dialog');discard.id='discard-form-draft';discard.innerHTML='<form method="dialog"><h2>放棄草稿？</h2><p>呢份未儲存草稿會移除。</p><div class="form-bottom"><button value="cancel">取消</button><button value="discard">放棄草稿</button></div></form>';document.body.append(discard);let discarding=null;
 discard.addEventListener('close',()=>{if(discard.returnValue!=='discard'||!discarding)return;try{store?.remove(discarding);updateDraftBanner()}catch{toast('未能移除草稿。')}discarding=null});
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-resume-form'))resumeDraft($('#brew-draft-entry select').value);if(b.hasAttribute('data-discard-form')){discarding=$('#brew-draft-entry select').value;discard.returnValue='';discard.showModal()}if(b.closest('#brewform'))queueMicrotask(()=>saveDraft())});
 form.addEventListener('input',()=>{updateWaterSummary();saveDraft()});form.addEventListener('change',()=>{updateWaterSummary();saveDraft()});
 $('#scale-form').addEventListener('submit',()=>{updateWaterSummary();saveDraft()});
 editor.addEventListener('close',()=>{saveDraft();active=false});
 const previousSubmit=form.onsubmit;form.onsubmit=e=>{const wasRecipe=form.classList.contains('recipe-editing'),id=activeId;submitting=true;try{previousSubmit(e);if(!wasRecipe&&!editor.open){active=false;try{store?.remove(id)}catch{toast('紀錄已儲存，但未能清除本機草稿。')}updateDraftBanner()}}finally{submitting=false}if(editor.open)saveDraft()};
 window.coffeeBeforeAccountChange=()=>{saveDraft();active=false;activeId=null;currentExperiment=null};
 window.coffeeFormDraftAccount=uid=>{active=false;activeId=null;account=uid;store=createBrewDraftStore(localStorage,uid);draftStatus.textContent='';updateDraftBanner()};
 const previousAccount=window.coffeeExperienceAccount;window.coffeeExperienceAccount=uid=>{previousAccount?.(uid);window.coffeeFormDraftAccount(uid)};
 window.addEventListener('pagehide',saveDraft);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveDraft()});
 window.addEventListener('storage',e=>{if(e.key===store?.key)updateDraftBanner()});
 updateWaterSummary();updateDraftBanner();
})();
