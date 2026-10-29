(() => {
  const style=document.createElement('link');style.rel='stylesheet';style.href='suggestions.css';document.head.append(style);
  const preferenceFields={prefAcid:{title:'酸度合唔合口味？',options:[['low','太低'],['right','啱啱好'],['high','太高']]},prefStrength:{title:'濃淡合唔合口味？',options:[['weak','太淡'],['right','啱啱好'],['strong','太濃']]},prefBitter:{title:'苦澀感',options:[['right','冇問題'],['bitter','太苦'],['astringent','太澀']]},prefSweet:{title:'甜感',options:[['right','滿意'],['more','想再甜啲']]}};
  const prefs=document.createElement('section');prefs.className='taste-preferences';
  prefs.innerHTML='<h3>啱唔啱自己？</h3><p class="hint">感覺強弱同喜唔喜歡分開記，建議先以你嘅口味為準。</p><div class="fields">'+Object.entries(preferenceFields).map(([key,f])=>`<label>${f.title}<select name="${key}"><option value="">未選擇</option>${f.options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>`).join('')+'</div><div id="trial-context" hidden></div>';
  $('#ratings').after(prefs);
  const tempLabel=document.createElement('label');tempLabel.className='temperature-source';tempLabel.innerHTML='水溫資料來源<select name="tempSource"><option value="unknown">未註明／未量度</option><option value="estimated">溝水計算／估算</option><option value="measured">溫度計實測</option></select>';form.elements.temp.closest('.fields').after(tempLabel);
  const compare=document.createElement('dialog');compare.id='brew-comparison';compare.setAttribute('aria-labelledby','compare-title');document.body.append(compare);
  let selectedId=null, pendingTrial=null;
  const key=b=>String(b||'').trim().toLocaleLowerCase();
  const same=(a,b)=>!b.demo&&(a.beanId&&b.beanId?a.beanId===b.beanId:key(a.bean)===key(b.bean))&&a.method===b.method&&(a.drinkStyle||'hot')===(b.drinkStyle||'hot')&&Number(a.ice||0)===Number(b.ice||0);
  const earlier=(a,b)=>b.date<a.date||(b.date===a.date&&records.indexOf(b)>records.indexOf(a));
  const sorted=rr=>rr.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const fieldTitle={clicks:'C40 格數',dose:'咖啡粉量'};
  const unit={clicks:' clicks',dose:'g'};
  const sourceTitle={estimated:'估算',measured:'實測',unknown:'未註明'};
  const trialLabels={better:'好咗',same:'差唔多',worse:'差咗',unsure:'未能判斷'};
  function summarySteps(r){return Array.isArray(r.stages)?JSON.stringify(r.stages.map(s=>({action:s.action,start:s.start,water:s.water,temp:s.temp||'',next:s.next,until:s.until,valve:r.method==='Hario Switch'?s.valve:undefined,note:s.note}))):r.steps||''}
  function renderComparison(baselineId){const current=records.find(r=>r.id===selectedId);if(!current)return;const candidates=sorted(records.filter(r=>same(current,r)&&earlier(current,r)));const baseline=candidates.find(r=>r.id===baselineId)||candidates[0];const best=sorted(records.filter(r=>same(current,r)&&r.rating!=null)).sort((a,b)=>Number(b.rating)-Number(a.rating))[0];const advice=brewAdvice(current,baseline);const dims=[['clicks','C40 格數',' clicks'],['temp','水溫','°C'],['dose','粉量','g'],['water','總注水','g'],['seconds','總時間','秒'],['acid','酸感',' / 5'],['sweet','甜感',' / 5'],['rating','滿意度',' / 5']];
    const changes=baseline?dims.slice(0,5).filter(([k])=>current[k]!=null&&baseline[k]!=null&&Number(current[k])!==Number(baseline[k])).map(([,title])=>title):[];
    const changedSteps=baseline&&summarySteps(current)!==summarySteps(baseline);
    compare.innerHTML=`<div class="dialog-head"><div><small>COMPARE & TRY</small><h2 id="compare-title">下一杯，點樣試？</h2></div><button type="button" class="icon" data-advice-close aria-label="關閉沖煮建議">✕</button></div><h3 translate="no">${esc(current.bean)}</h3><p class="hint">${esc(current.method)} · 今次 ${esc(current.date.replace('T',' '))}<br>優先比對同包咖啡豆、同一器具；未連結豆資料嘅舊紀錄按豆名比較。</p>${candidates.length?`<label>與較早嘅一杯比較<select id="baseline-select">${candidates.map(r=>`<option value="${esc(r.id)}" ${r.id===baseline?.id?'selected':''}>${esc(r.date.replace('T',' '))} · ${r.rating==null?'未評分':r.rating+'/5'}${r.id===best?.id?' · 最滿意':''}</option>`).join('')}</select></label><div class="comparison-scroll"><table><thead><tr><th>參數／感受</th><th>比較嗰杯</th><th>今次</th></tr></thead><tbody>${dims.map(([k,title,u])=>`<tr class="${current[k]!=null&&baseline[k]!=null&&Number(current[k])!==Number(baseline[k])?'different':''}"><th>${title}</th><td>${baseline[k]==null?'—':esc(baseline[k])+u}</td><td>${current[k]==null?'—':esc(current[k])+u}</td></tr>`).join('')}</tbody></table></div><p class="hint">水溫：比較嗰杯 ${sourceTitle[baseline.tempSource]||'未註明'}；今次 ${sourceTitle[current.tempSource]||'未註明'}。上表水溫及總時間為原填寫／目標值；實際值可於紀錄內另行查看。</p><p class="advice-evidence">${changes.length?'今次有改：'+changes.join('、')+'。':'核心數字未變。'}${changedSteps?' 分段流程／備註亦有不同。':''}${changes.length+(changedSteps?1:0)>1?' 多項設定一齊改過，未能判斷邊項造成味道變化。':''}</p>`:'<div class="advice-evidence">未有較早嘅同豆、同器具紀錄。以下只係一般試驗起點，未能從歷史紀錄判斷原因。</div>'}<section class="advice-card"><span class="badge">規則建議 · 非因果判定</span>${advice.field?`<h3>下杯先試：${fieldTitle[advice.field]} ${advice.from} → ${advice.value}${unit[advice.field]}</h3><p>${esc(advice.reason)}</p><button type="button" class="primary" data-try>用呢個建議開下一杯 →</button>`:`<p>${esc(advice.message)}</p>`}<p class="hint">每次只試一個改動；豆嘅新鮮度、水質、注水手勢及實際水溫都可能影響結果。</p></section>${best?`<section class="best-rebrew"><b>另一個選擇：重沖最滿意嗰杯</b><p>${esc(best.date.replace('T',' '))} · ${best.rating}/5 · ${best.clicks} clicks · ${best.temp}°C</p><button type="button" class="text-link" data-best="${esc(best.id)}">帶入嗰杯配方 →</button></section>`:''}${current.experiment?`<p class="hint">今次試驗：${esc(current.experiment.label)}<br>回饋：${trialLabels[current.trialResult]||'未填寫'}。以主觀回饋記錄，未視為因果證明。</p>`:''}`;
    compare.querySelector('[data-advice-close]').onclick=()=>compare.close();const selector=compare.querySelector('#baseline-select');if(selector)selector.onchange=()=>renderComparison(selector.value);
    compare.querySelector('[data-try]')?.addEventListener('click',()=>{compare.close();startTrial(current,advice)});
    compare.querySelector('[data-best]')?.addEventListener('click',()=>{compare.close();startTrial(best,null)});
  }
  function showAdvice(id){selectedId=id;renderComparison();if(!compare.open)compare.showModal()}
  function trialContext(r){const panel=$('#trial-context');panel.hidden=!r?.experiment;if(!r?.experiment){panel.innerHTML='';return}panel.innerHTML=`<div class="trial-note"><b>呢杯嘅試驗</b><p>${esc(r.experiment.label)}</p><p class="hint">比較對象：${esc(r.experiment.baseDate||'')} · <span translate="no">${esc(r.experiment.bean||'')}</span></p><label>同嗰杯相比，目標口味有冇改善？<select name="trialResult"><option value="">未填寫</option>${Object.entries(trialLabels).map(([v,t])=>`<option value="${v}" ${r.trialResult===v?'selected':''}>${t}</option>`).join('')}</select></label></div>`}
  const priorOpen=openBrew;openBrew=function(r){priorOpen(r);pendingTrial=r?.experiment?JSON.parse(JSON.stringify(r.experiment)):null;trialContext(r)};
  function startTrial(base,advice){
    const next=JSON.parse(JSON.stringify(base));
    delete next.id;delete next.demo;delete next.experiment;delete next.trialResult;
    for(const k of ['rating','sweet','acid','bitter','body',...Object.keys(preferenceFields)])next[k]='';
    for(const k of ['actualWater','actualTemp','actualSeconds','timerSessionId','finishedAt'])delete next[k];next.notes='';next.tempSource=base.tempSource==='estimated'?'estimated':'unknown';
    if(Array.isArray(next.stages))next.stages=next.stages.map(s=>({...s,actualWater:'',actualTime:'',actualTemp:''}));
    if(advice)next[advice.field]=advice.value;
    openBrew(next);
    pendingTrial={baseId:base.id,baseDate:base.date,bean:base.bean,label:advice?`${fieldTitle[advice.field]} ${advice.from} → ${advice.value}${unit[advice.field]}；其他配方設定沿用。`:'重沖最滿意嗰杯配方，觀察可唔可以重現。',field:advice?.field||null,from:advice?.from??null,value:advice?.value??null};
    trialContext({experiment:pendingTrial});
  }
  const priorPersist=persist;persist=function(next){const target=editing||next[0]?.id;const updated=next.map(r=>r.id===target?{...r,...(pendingTrial?{experiment:pendingTrial}:{})}:r);const ok=priorPersist(updated);if(ok){selectedId=target;setTimeout(()=>{if(!$('#editor').open)showAdvice(target)},0)}return ok};
  const priorCard=card;card=function(r){const html=priorCard(r);return r.demo?html:html.replace('</article>',`<button type="button" class="advice-link" data-advice="${esc(r.id)}">比較紀錄・下杯建議 ↗</button></article>`)};
  document.addEventListener('click',e=>{const b=e.target.closest('[data-advice]');if(b)showAdvice(b.dataset.advice)});
  const priorPreset=$('#preset').onchange;$('#preset').onchange=e=>{priorPreset(e);if(e.target.value){pendingTrial=null;trialContext(null)}};
  render();
})();
