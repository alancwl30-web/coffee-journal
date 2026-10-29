// Heat balance in grams and degrees C; water 4.18 J/g/K, 304 stainless 0.50 J/g/K.
// Assumes the entered effective vessel mass equilibrates with the water.
function calculateWaterMix({mass,target,hot=100,room=25,correction=false,potMass=0,potTemp=25,loss=0}) {
  if(![mass,target,hot,room,loss].every(Number.isFinite)||mass<=0||mass>3000||[target,hot,room].some(t=>t<0||t>100)||loss<0||loss>15)throw Error('請填有效水量（大於 0 至 3,000g）、0–100°C 水溫及 0–15°C 散熱補償。');
  if(hot<=room)throw Error('熱水溫度必須高於室溫水。');
  if(target<room||target>hot)throw Error('目標水溫需介乎室溫水與熱水溫度之間。');
  if(correction&&(!Number.isFinite(potMass)||potMass<=0||potMass>5000||!Number.isFinite(potTemp)||potTemp<0||potTemp>100))throw Error('開啟吸熱修正後，請填空壺重量（大於 0 至 5,000g）及 0–100°C 壺溫。');
  const equilibrium=target+loss;
  if(equilibrium>100)throw Error('目標加散熱補償超過 100°C，請減少補償或降低目標。');
  const equivalent=correction?potMass*.5/4.18:0;
  const exact=(mass*(equilibrium-room)+equivalent*(equilibrium-potTemp))/(hot-room);
  if(exact>mass+1e-8)throw Error('熱量不足：請先預熱壺、增加準備水量，或降低目標／散熱補償。');
  if(exact< -1e-8)throw Error('壺身熱量過高，呢兩種水未能溝到目標；請先冷卻壺或調整壺溫。');
  const total=Math.round(mass*10)/10,hotGrams=Math.round(Math.max(0,Math.min(total,exact))*10)/10;
  return {mass:total,target,equilibrium,hotGrams,roomGrams:Math.round((total-hotGrams)*10)/10,hotPercent:hotGrams/total*100,potTemp:correction?potTemp:null};
}
function waterMixBatches(stages,defaultTemp,mode='group') {
  const groups=new Map();
  stages.forEach((s,i)=>{if(s.action!=='注水')return;const temp=s.temp===''||s.temp==null?Number(defaultTemp):Number(s.temp),mass=Number(s.water);const key=mode==='each'?'step-'+i:'temp-'+temp;
    if(!Number.isFinite(temp)||!Number.isFinite(mass)||mass<=0)throw Error('請先填妥各段注水量及目標水溫。');
    if(!groups.has(key))groups.set(key,{key,target:temp,mass:0,stages:[]});const batch=groups.get(key);batch.mass=Math.round((batch.mass+mass)*10)/10;batch.stages.push(i+1);
  });return [...groups.values()];
}
if(typeof module!=='undefined')module.exports={calculateWaterMix,waterMixBatches};

if(typeof document!=='undefined')(()=>{
 const style=document.createElement('link');style.rel='stylesheet';style.href='water-mix.css';document.head.append(style);
 const defaults={hot:100,room:25,correction:false,potMass:'',potMode:'room',potTemp:25,loss:0,mode:'group',overrides:{}};
 const read=value=>{try{const data=typeof value==='string'?JSON.parse(value):value;return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return {}}};
 let settings={...defaults,...read(localStorage.getItem('slowbrew-mix-settings-v2')),overrides:{}},scaled=null,standaloneResult=null;
 const fmt=n=>Number(n.toFixed(1)).toLocaleString('zh-HK',{maximumFractionDigits:1});
 const panels=[];
 const numeric=(value)=>value===''||value==null?NaN:Number(value);
 const field=(key,label,limits='min="0" max="100"',value=settings[key])=>`<label>${label}<input data-mix-setting="${key}" type="number" ${limits} step="0.1" inputmode="decimal" value="${esc(value)}"></label>`;
 function controls(){return `<details class="mix-settings"><summary>水溫、壺身及散熱設定</summary><div class="fields">${field('hot','熱水溫度 °C')}${field('room','室溫水溫度 °C')}</div><label class="mix-toggle"><input data-mix-setting="correction" type="checkbox" ${settings.correction?'checked':''}> 計算不鏽鋼壺吸熱</label><div data-pot-fields ${settings.correction?'':'hidden'}><p class="hint">304 不鏽鋼估算。請磅空壺；整壺重量包含壺柄，估算可能偏高，可用實測校準。</p><div class="fields">${field('potMass','空壺重量 g','min="0.1" max="5000"')}<label>壺初始狀態<select data-mix-setting="potMode"><option value="room" ${settings.potMode==='room'?'selected':''}>室溫壺（跟室溫水溫度）</option><option value="preheated" ${settings.potMode==='preheated'?'selected':''}>已預熱至目標＋補償溫度</option><option value="custom" ${settings.potMode==='custom'?'selected':''}>自行輸入壺溫</option></select></label></div><div data-pot-temp ${settings.potMode==='custom'?'':'hidden'}>${field('potTemp','壺初始溫度 °C')}</div></div>${field('loss','額外散熱補償 °C（未校準填 0）','min="0" max="15"')}<p class="hint">此值代表混合後至使用前預期跌溫，唔係固定壺身降溫；未有實測唔建議估填。</p><details><summary>用溫度計校準</summary><p class="hint">用相同壺、水量及倒水方式測試；填入目標及實際量度水溫。補償只適用於相近操作，唔保證其他水量同樣準確。</p><div class="fields"><label>該次目標 °C<input data-cal-target type="number" min="0" max="100" step="0.1"></label><label>量得水溫 °C<input data-cal-measured type="number" min="0" max="100" step="0.1"></label></div><button type="button" data-calibrate>按實測更新補償</button><p data-cal-status role="status"></p></details></details>`}
 function remember(){try{localStorage.setItem('slowbrew-mix-settings-v2',JSON.stringify({...settings,overrides:{}}))}catch{}const hidden=form.elements.waterMix;if(hidden)hidden.value=JSON.stringify(settings)}
 function syncControls(source){panels.forEach(p=>{if(p===source)return;p.querySelectorAll('[data-mix-setting]').forEach(el=>{const k=el.dataset.mixSetting;if(el.type==='checkbox')el.checked=!!settings[k];else el.value=settings[k]})});panels.forEach(p=>{p.querySelector('[data-pot-fields]').hidden=!settings.correction;p.querySelector('[data-pot-temp]').hidden=settings.potMode!=='custom'})}
 function calculation(batch){const mixTarget=batch.target+numeric(settings.loss);let initial=settings.potMode==='preheated'?mixTarget:settings.potMode==='room'?numeric(settings.room):numeric(settings.potTemp);const override=settings.overrides[batch.key];if(override!==''&&override!=null)initial=numeric(override);
  return calculateWaterMix({...batch,hot:numeric(settings.hot),room:numeric(settings.room),correction:settings.correction,potMass:numeric(settings.potMass),potTemp:initial,loss:numeric(settings.loss)});
 }
 function table(batches){if(!batches.length)return '<p class="hint">加入注水段落後，即時顯示溝水份量。</p>';return batches.map(b=>{let result,error;try{result=calculation(b)}catch(e){error=e.message}
  return `<article class="mix-batch"><div class="mix-batch-title"><b>${fmt(b.target)}°C · ${fmt(b.mass)}g 水</b><span>第 ${b.stages.join('、')} 段${settings.mode==='group'?'合併準備':''}</span></div>${settings.correction?`<label>此批壺起始溫度 °C（選填，覆蓋共用設定）<input data-batch-temp="${esc(b.key)}" type="number" min="0" max="100" step="0.1" placeholder="沿用共用設定" value="${esc(settings.overrides[b.key]??'')}"></label>`:''}<div class="mix-batch-result">${error?`<p class="mix-error" role="alert">${esc(error)}</p>`:`<div class="mix-amounts"><div><span>${esc(settings.hot)}°C 熱水</span><strong>${fmt(result.hotGrams)}<small> g</small></strong><em>${fmt(result.hotPercent)}%</em></div><b>＋</b><div><span>${esc(settings.room)}°C 室溫水</span><strong>${fmt(result.roomGrams)}<small> g</small></strong><em>${fmt(100-result.hotPercent)}%</em></div></div><p class="mix-pour">${settings.correction?'壺初始 '+fmt(result.potTemp)+'°C；已計壺身吸熱。':'未計壺身吸熱。'}${numeric(settings.loss)?' 混合平衡溫度先以 '+fmt(result.equilibrium)+'°C 為目標。':''}<br>空壺放磅歸零 → 熱水加至 <b>${fmt(result.hotGrams)}g</b> → 唔歸零，室溫水加至總重 <b>${fmt(result.mass)}g</b> → 攪勻量溫。</p>`}</div></article>`}).join('')}
 function batchesFor(kind){if(kind==='single')return [{key:'single',target:numeric(dialog.querySelector('#mix-target').value),mass:numeric(dialog.querySelector('#mix-mass').value),stages:[1]}];if(kind==='scale')return scaled?waterMixBatches(scaled.stages,scaled.temp,settings.mode):[];return waterMixBatches(typeof stages==='undefined'?[]:stages,form.elements.temp.value,settings.mode)}
 function renderResults(){panels.forEach(p=>{const out=p.querySelector('[data-mix-results]');try{const batches=batchesFor(p.dataset.mixKind);out.innerHTML=table(batches);if(p.dataset.mixKind==='single'){standaloneResult=null;try{standaloneResult=calculation(batches[0])}catch{}dialog.querySelector('#mix-apply').disabled=!standaloneResult}}catch(e){out.innerHTML=`<p class="mix-error" role="alert">${esc(e.message)}</p>`}})}
 function mount(kind){const panel=document.createElement('section');panel.className='recipe-water-mix';panel.dataset.mixKind=kind;panel.innerHTML=`<h3>分段水溫與溝水計算</h3><p class="hint">只計注水，唔包括分享壺冰。${kind==='single'?'': '水量跟隨粉量換算；各段沿用自己嘅目標水溫。'}</p>${kind==='single'?'':`<label>準備方式<select data-mix-setting="mode"><option value="group" ${settings.mode==='group'?'selected':''}>相同水溫一次準備</option><option value="each" ${settings.mode==='each'?'selected':''}>逐段分開準備</option></select></label>`}${controls()}<div data-mix-results aria-live="polite"></div><p class="mix-caveat">理論估算，假設壺身與水充分達到熱平衡；未自動模擬倒水、等待及空氣散熱。多批水預設各自使用所選狀態嘅空壺；重用已暖嘅壺，請改該批起始壺溫，唔會自動當佢回復室溫。</p>`;
  panel.addEventListener('input',event=>{const el=event.target;if(el.dataset.mixSetting){const k=el.dataset.mixSetting;settings[k]=el.type==='checkbox'?el.checked:el.value;syncControls(panel);remember();renderResults()}if(el.dataset.batchTemp){settings.overrides[el.dataset.batchTemp]=el.value;remember(); // Keep the focused input intact while refreshing calculations.
   panels.forEach(p=>{if(p!==panel)return;const b=batchesFor(p.dataset.mixKind).find(x=>x.key===el.dataset.batchTemp);if(!b)return;const html=document.createElement('div');html.innerHTML=table([b]);el.closest('.mix-batch').querySelector('.mix-batch-result').innerHTML=html.querySelector('.mix-batch-result').innerHTML});panels.filter(p=>p!==panel).forEach(p=>{p.querySelector('[data-mix-results]').innerHTML=table(batchesFor(p.dataset.mixKind))});
  }});
  panel.addEventListener('change',e=>{if(e.target.dataset.mixSetting||e.target.dataset.batchTemp){remember();renderResults()}});
  panel.addEventListener('click',e=>{if(!e.target.closest('[data-calibrate]'))return;const a=panel.querySelector('[data-cal-target]'),b=panel.querySelector('[data-cal-measured]'),output=panel.querySelector('[data-cal-status]');const desired=numeric(a.value),measured=numeric(b.value);if(!Number.isFinite(desired)||!Number.isFinite(measured)||desired<0||desired>100||measured<0||measured>100){output.textContent='請填 0–100°C 目標及實測溫度。';return}const next=Math.round((numeric(settings.loss)+desired-measured)*10)/10;if(!Number.isFinite(next)||next<0||next>15){output.textContent='推算補償超出 0–15°C，請先檢查壺重量、起始壺溫及量度方式。';return}settings.loss=next;syncControls();remember();renderResults();output.textContent='已將額外散熱補償設為 '+fmt(next)+'°C；請以相同方法再測試。'});
  panels.push(panel);return panel;
 }
 const dialog=document.createElement('dialog');dialog.id='water-mix';dialog.setAttribute('aria-labelledby','mix-title');dialog.innerHTML=`<form id="mix-form"><div class="dialog-head"><div><small>WATER MIX CALCULATOR</small><h2 id="mix-title">溝出你想要嘅水溫</h2></div><button type="button" class="icon" data-mix-close aria-label="關閉溝水計算器">✕</button></div><div class="fields"><label>目標總水量 g<input id="mix-mass" type="number" min="0.1" max="3000" step="0.1" value="200" required></label><label>目標水溫 °C<input id="mix-target" type="number" min="0" max="100" step="0.1" value="86" required></label></div><div class="form-bottom"><span>帶入水量與水溫；分段水量需另行對齊</span><button type="submit" id="mix-apply" class="primary">帶入沖煮參數 →</button></div></form>`;document.body.append(dialog);dialog.querySelector('.form-bottom').before(mount('single'));
 const nav=document.createElement('button');nav.type='button';nav.textContent='◷　溝水計算';document.querySelector('nav').append(nav);nav.onclick=()=>{renderResults();dialog.showModal()};dialog.querySelector('[data-mix-close]').onclick=()=>dialog.close();dialog.querySelector('#mix-form').addEventListener('input',e=>{if(e.target.id==='mix-mass'||e.target.id==='mix-target')renderResults()});
 dialog.querySelector('#mix-form').onsubmit=e=>{e.preventDefault();renderResults();if(!standaloneResult)return;const r=standaloneResult;dialog.close();if(!$('#editor').open)openBrew();form.elements.water.value=r.mass;form.elements.temp.value=r.target;if(form.elements.tempSource)form.elements.tempSource.value='estimated';remember();ratio();if(typeof updateSummary==='function')updateSummary();renderResults();toast('已帶入水量及目標水溫；請檢查分段注水合計。')};
 window.prepareRecipeWaterMix=(saved,fromEditor)=>{if(fromEditor)return;settings={...defaults,...read(localStorage.getItem('slowbrew-mix-settings-v2')),...read(saved),overrides:{...read(read(saved).overrides)}};syncControls();remember()};
 window.refreshRecipeWaterMix=(value)=>{if(value!==undefined)scaled=value;renderResults()};
 window.initRecipeWaterMix=()=>{
  const hidden=document.createElement('input');hidden.type='hidden';hidden.name='waterMix';form.append(hidden);
  stageSection.after(mount('editor'));document.querySelector('#scale-output').after(mount('scale'));
  const previous=openBrew;openBrew=function(r){previous(r);const prefs=read(localStorage.getItem('slowbrew-mix-settings-v2'));settings={...defaults,...prefs,...read(r?.waterMix),overrides:{...read(read(r?.waterMix).overrides)}};syncControls();remember();renderResults()};
  form.addEventListener('input',e=>{if(e.target.closest('.recipe-water-mix'))return;renderResults()});form.addEventListener('change',e=>{if(!e.target.closest('.recipe-water-mix'))renderResults()});
  new MutationObserver(()=>renderResults()).observe(stageSection,{childList:true,subtree:true});remember();renderResults();
 };
})();
