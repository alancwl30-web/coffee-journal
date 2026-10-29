// Water scales by weight; the recipe's clock, temperature and grind remain references.
function scaleRecipe(recipe, sourceStages, dose, customWater = null) {
  const round = n => Math.round((n + Number.EPSILON) * 10) / 10;
  const valid = (n, max) => Number.isFinite(n) && n >= 1 && n <= max && Math.abs(n * 10 - Math.round(n * 10)) < 1e-7;
  if (!valid(dose, 200)) throw new Error('粉量請填 1–200g，最多一位小數。');
  const water = customWater === null ? round(recipe.water * dose / recipe.dose) : customWater;
  if (!valid(water, 3000)) throw new Error('總注水請填 1–3,000g，最多一位小數。');
  const pours = sourceStages.filter(s => s.action === '注水');
  const sourceTotal = pours.reduce((n, s) => n + Number(s.water), 0);
  if (!pours.length || Math.abs(sourceTotal - recipe.water) > .05) throw new Error('原食譜分段水量未對齊，暫時未能換算。');
  // Largest remainders distribute 0.1g rounding without changing the target total.
  const allocations = pours.map((s, i) => {
    const exact = water * 10 * Number(s.water) / sourceTotal;
    return {i, units: Math.floor(exact), fraction: exact - Math.floor(exact)};
  });
  const remaining = Math.round(water * 10) - allocations.reduce((n, a) => n + a.units, 0);
  const ordered = allocations.slice().sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  for (let i = 0; i < remaining; i++) ordered[i].units++;
  if (allocations.some(a => a.units < 1)) throw new Error('呢個水量太少，無法為每段分配至少 0.1g 水。');
  const ice = round(Number(recipe.ice || 0) * dose / recipe.dose);
  if (ice > 3000) throw new Error('調整後冰量超過 3,000g，請減少粉量。');
  let i = 0;
  const adjustedStages = sourceStages.map(s => ({...s,
    water: s.action === '注水' ? allocations[i++].units / 10 : 0,
    actualWater: '', actualTime: '', actualTemp: '',
    // Keep numeric water/ice instructions consistent with the adjusted targets.
    note: String(s.note || '').replace(/(\d+(?:\.\d+)?)\s*g\b/gi, (_, grams) => round(Number(grams) * (String(s.note).includes('冰') ? dose / recipe.dose : water / recipe.water)) + 'g')
  }));
  return {dose, water, ice, stages: adjustedStages,
    largeChange: dose / recipe.dose < .7 || dose / recipe.dose > 1.5,
    ratioChanged: Math.abs(water / dose - recipe.water / recipe.dose) > .05};
}
if (typeof module !== 'undefined') module.exports = {scaleRecipe};

if (typeof document !== 'undefined') (() => {
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'recipe-scale.css'; document.head.append(css);
  const meta = document.createElement('input'); meta.type = 'hidden'; meta.name = 'recipeScale'; form.append(meta);
  const launch = document.createElement('button'); launch.type = 'button'; launch.className = 'scale-inline'; launch.textContent = '⚖ 按粉量調整食譜'; launch.hidden = true;
  $('#preset').closest('label').after(launch);
  const provenance = document.createElement('p'); provenance.className = 'scale-provenance'; provenance.hidden = true; launch.after(provenance);
  const modal = document.createElement('dialog'); modal.id = 'recipe-scaler'; modal.setAttribute('aria-labelledby', 'scale-title');
  modal.innerHTML = `<form id="scale-form" novalidate><div class="dialog-head"><div><small>YOUR DOSE, YOUR CUP</small><h2 id="scale-title">按粉量調整</h2></div><button type="button" class="icon" data-scale-close aria-label="關閉粉量換算">✕</button></div>
    <p id="scale-origin" class="scale-origin"></p><div class="fields"><label>想用幾多咖啡粉 g<input id="scale-dose" type="number" min="1" max="200" step="0.1" inputmode="decimal" required></label><label>總注水方式<select id="scale-mode"><option value="ratio">保留原食譜粉水比</option><option value="custom">指定總注水量</option></select></label></div>
    <div class="scale-quick">${[12,15,20].map(n=>`<button type="button" data-scale-dose="${n}">${n}g</button>`).join('')}</div>
    <label id="scale-water-label" hidden>指定總注水 g（唔包括冰）<input id="scale-water" type="number" min="1" max="3000" step="0.1" inputmode="decimal"></label>
    <p id="scale-error" role="alert" hidden></p><div id="scale-output" aria-live="polite"></div>
    <div class="form-bottom"><span>原食譜保留；帶入後可再修改</span><button class="primary" id="scale-apply" type="submit">用調整版開新紀錄 →</button></div></form>`;
  document.body.append(modal);
  const find = s => modal.querySelector(s), fmt = n => Number(Number(n).toFixed(1)).toLocaleString('zh-HK', {maximumFractionDigits:1});
  let original = null, result = null, inEditor = false, activeRecipe = null;
  const parseMeta = value => {try {return typeof value === 'string' ? JSON.parse(value) : value} catch {return null}};
  function showProvenance() {
    const m = parseMeta(meta.value); provenance.hidden = !m;
    provenance.innerHTML = m ? `<span translate="no">${esc(m.title)}</span> · 按粉量調整版（原配方 ${m.originalDose}g／${m.originalWater}g）。時間、水溫及研磨沿用參考；請記低實際流完時間。` : '';
  }
  function update() {
    modal.querySelectorAll('[data-scale-dose]').forEach(b=>{const selected=Number(b.dataset.scaleDose)===Number(find('#scale-dose').value);b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
    const custom = find('#scale-mode').value === 'custom';
    find('#scale-water-label').hidden = !custom; find('#scale-water').disabled = !custom;
    try {
      const doseText = find('#scale-dose').value, waterText = find('#scale-water').value;
      if (!doseText || (custom && !waterText)) throw new Error('請填寫粉量及指定總注水量。');
      const source = original.stages || stageRecipes[original.id]?.map(s=>stepDefaults(s));
      result = scaleRecipe(original, source || [], Number(doseText), custom ? Number(waterText) : null);
      find('#scale-error').hidden = true; find('#scale-output').hidden = false; find('#scale-apply').disabled = false;
      let sum = 0;
      find('#scale-output').innerHTML = `<section class="scale-totals"><b>${fmt(result.dose)}g 粉 → ${fmt(result.water)}g 注水</b><span>粉水比 1:${fmt(result.water/result.dose)}${original.drinkStyle==='iced'?` · 分享壺冰 ${fmt(result.ice)}g`:''}</span></section>
        ${result.ratioChanged?'<p class="scale-warning">粉水比已改變，各段按原注水比例分配，味道可能與原配方不同。</p>':''}
        ${original.drinkStyle==='iced'?'<p class="hint">冰量按粉量比例調整；指定注水量時冰量維持此換算值。注水＋冰係材料總量，唔等於成品重量。</p>':''}
        <div class="scale-table-wrap"><table class="scale-table"><thead><tr><th>開始／動作</th><th>本段</th><th>磅上累積</th><th>參考條件</th></tr></thead><tbody>${result.stages.map(s=>{const pour=s.action==='注水';if(pour)sum=Math.round((sum+s.water)*10)/10;return `<tr><th>${esc(s.start)}<small>${esc(s.action)}${original.method==='Hario Switch'?' · '+esc(s.valve)+'閥':''}</small></th><td>${pour?'+'+fmt(s.water)+'g':'—'}</td><td>${pour?fmt(sum)+'g':'—'}</td><td>${pour?fmt(s.temp||original.temp)+'°C<br>':''}${s.next==='指定時間'?'等至 '+esc(s.until):esc(s.next)}${s.note?'<small '+(original._customRecipe?'translate="no"':'')+'>'+esc(s.note)+'</small>':''}</td></tr>`}).join('')}</tbody></table></div>
        <p class="scale-time"><b>時間沿用原食譜，唔按粉量縮放。</b><br>悶蒸、浸泡及各段時間均作首次試沖參考；等流完以實際流速為準。原總時間參考 ${clock(original.seconds)}，唔係換算後完成時間預測。<br>水溫 ${fmt(original.temp)}°C、C40 ${fmt(original.clicks)} 格亦先保留；分段水溫如上表。</p>
        ${result.largeChange?'<p class="scale-warning">粉量低於原配方 70% 或高於 150%，差距較大；請確認器具容量，時間及研磨需要試沖確認。</p>':''}`;
    } catch(error) {
      result = null; find('#scale-error').textContent = error.message; find('#scale-error').hidden = false; find('#scale-output').hidden = true; find('#scale-apply').disabled = true;
    }
    window.refreshRecipeWaterMix?.(result?{stages:result.stages,temp:original.temp}:null);
  }
  function openScale(id, fromEditor = false) {
    original = allRecipes().find(r=>r.id===id); if(!original)return;
    inEditor = fromEditor;
    find('#scale-origin').innerHTML = `<span ${original._customRecipe?'translate="no"':''}>${esc(original.title)}</span> · ${esc(original.author)}｜原配方 ${original.dose}g 粉／${original.water}g 水${original.ice?'／冰 '+original.ice+'g':''} · 1:${fmt(original.water/original.dose)}`;
    find('#scale-dose').value = fromEditor ? form.elements.dose.value : original.dose;
    find('#scale-water').value = fromEditor ? form.elements.water.value : original.water;
    const saved = fromEditor ? parseMeta(meta.value) : null;
    find('#scale-mode').value = saved?.recipeId===original.id ? saved.mode : (fromEditor && Math.abs(Number(form.elements.water.value)/Number(form.elements.dose.value)-original.water/original.dose)>.05 ? 'custom' : 'ratio');
    find('#scale-apply').textContent = fromEditor ? '帶入目前沖煮表單 →' : '用調整版開新紀錄 →';
    window.prepareRecipeWaterMix?.(original.waterMix,fromEditor);
    update(); modal.showModal();
  }
  modal.querySelector('[data-scale-close]').onclick = ()=>modal.close();
  find('#scale-form').oninput = e=>{if(!e.target.closest('.recipe-water-mix'))update()};
  find('#scale-form').onchange = e=>{if(!e.target.closest('.recipe-water-mix'))update()};
  modal.addEventListener('click',e=>{const b=e.target.closest('[data-scale-dose]');if(b){find('#scale-dose').value=b.dataset.scaleDose;update()}});
  find('#scale-form').onsubmit = e => {
    e.preventDefault(); update(); if(!result)return;
    const m = {recipeId:original.id,title:original.title,originalDose:original.dose,originalWater:original.water,targetDose:result.dose,targetWater:result.water,mode:find('#scale-mode').value,timePolicy:'original-reference'};
    const next = {...original,...result,waterMix:form.elements.waterMix?.value||'',recipeTemplate:original.title+'（按粉量調整版；'+original.author+'）',recipeScale:JSON.stringify(m)};
    next.steps = next.stages.map(s=>`${s.start} ${s.action}${s.action==='注水'?` +${fmt(s.water)}g / ${s.temp||original.temp}°C`:''}${original.method==='Hario Switch'?' · 閥門'+s.valve:''}${s.next==='指定時間'?' · 等至 '+s.until:' · '+s.next}${s.note?' · '+s.note:''}`).join('\n');
    modal.close();
    if (inEditor) {
      for (const k of ['dose','water','ice','temp','clicks','seconds','steps','recipeTemplate','recipeScale']) form.elements[k].value=next[k];
      stages=next.stages.map(s=>stepDefaults(s));renderStages();ratio();showProvenance();
      $('#recipe-attribution').innerHTML='食譜起點：<span translate="no">'+esc(next.recipeTemplate)+'</span>；可以自行修改。';
    } else openBrew(next);
    toast('已帶入調整版；時間沿用參考，請記錄實際流完時間');
  };
  launch.onclick=()=>openScale(activeRecipe,true);
  const previousOpen=openBrew;openBrew=function(r){meta.value='';form.elements.recipeTemplate.value='';previousOpen(r);const m=parseMeta(r?.recipeScale);activeRecipe=m?.recipeId||(allRecipes().some(x=>x===r)?r.id:null);launch.hidden=!activeRecipe;showProvenance()};
  const previousPreset=$('#preset').onchange;$('#preset').onchange=e=>{previousPreset(e);activeRecipe=e.target.value||null;meta.value='';launch.hidden=!activeRecipe;showProvenance()};
  function addButtons(){if(page!=='recipes')return;document.querySelectorAll('[data-recipe]').forEach(b=>{if(b.parentElement.querySelector('[data-scale-recipe]'))return;const scale=document.createElement('button');scale.type='button';scale.className='scale-inline';scale.dataset.scaleRecipe=b.dataset.recipe;scale.textContent='⚖ 按粉量調整';b.before(scale)})}
  const previousRender=render;render=function(){previousRender();addButtons()};
  document.addEventListener('click',e=>{const b=e.target.closest('[data-scale-recipe]');if(b)openScale(b.dataset.scaleRecipe)});
  render();
})();
