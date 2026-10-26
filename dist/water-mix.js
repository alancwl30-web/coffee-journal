(() => {
  const styles = document.createElement('link');
  styles.rel = 'stylesheet'; styles.href = 'water-mix.css'; document.head.append(styles);
  const navButton = document.createElement('button');
  navButton.type = 'button'; navButton.textContent = '◷　溝水計算';
  document.querySelector('nav').append(navButton);
  const inlineButton = document.createElement('button');
  inlineButton.type = 'button'; inlineButton.className = 'mix-inline';
  inlineButton.textContent = '◷ 冇恆溫壺？計算滾水＋室溫水';
  form.elements.temp.closest('.fields').after(inlineButton);
  const dialog = document.createElement('dialog'); dialog.id = 'water-mix';
  dialog.setAttribute('aria-labelledby', 'mix-title');
  dialog.innerHTML = `<form id="mix-form" novalidate>
    <div class="dialog-head"><div><small>WATER MIX CALCULATOR</small><h2 id="mix-title">溝出你想要嘅水溫</h2></div><button type="button" class="icon" id="mix-close" aria-label="關閉溝水計算器">✕</button></div>
    <p class="mix-intro">輸入水量同溫度，用電子磅就可以量出兩份水。</p>
    <div class="fields"><label>目標總水量 g<input id="mix-mass" type="number" min="0.1" max="10000" step="0.1" value="200" required inputmode="decimal"></label><label>想要嘅水溫 °C<input id="mix-target" type="number" min="0" max="100" step="0.1" value="86" required inputmode="decimal"></label></div>
    <div class="mix-presets" aria-label="快速選擇目標水溫">${[80,85,86,90,92,95].map(t=>`<button type="button" data-mix-temp="${t}">${t}°C</button>`).join('')}</div>
    <div class="fields"><label>熱水溫度 °C<input id="mix-hot" type="number" min="0" max="100" step="0.1" value="100" required inputmode="decimal"></label><label>室溫水溫度 °C<input id="mix-room" type="number" min="0" max="100" step="0.1" value="25" required inputmode="decimal"></label></div>
    <p class="hint">室溫水先以 25°C 估算；有溫度計就填實測值。滾水放涼後亦可改熱水溫度。</p>
    <div id="mix-error" role="alert" hidden></div>
    <section id="mix-result" aria-live="polite" aria-atomic="true"></section>
    <details class="mix-theory"><summary>點樣計？</summary><p>熱水重量 = 總水量 ×（目標溫度 − 室溫水溫度）÷（熱水溫度 − 室溫水溫度）。<br>室溫水重量 = 總水量 − 熱水重量。</p></details>
    <p class="mix-caveat">理論估算：未計壺身吸熱同倒水散熱。先預熱容器，混合後輕輕攪勻；想準確知道沖煮水溫，仍需用溫度計量度。</p>
    <div class="form-bottom"><span id="mix-apply-hint">帶入後仍可自由修改</span><button class="primary" id="mix-apply" type="submit">帶入沖煮參數 →</button></div>
  </form>`;
  document.body.append(dialog);
  const find = s => dialog.querySelector(s);
  const inputs = ['mass','target','hot','room'].map(x=>find('#mix-'+x));
  inputs[0].max=form.elements.water.max;
  form.elements.water.step='0.1';form.elements.temp.step='0.1';
  let result = null;
  const fmt = n => Number(n.toFixed(1)).toLocaleString('zh-HK',{maximumFractionDigits:1});
  function calculate() {
    const [mass,target,hot,room] = inputs.map(x=>Number(x.value));
    let error = '';
    if(inputs.some(x=>!x.value.trim()||!x.validity.valid)||!inputs.every(x=>Number.isFinite(Number(x.value)))) error='請填寫有效水量及 0–100°C 之間嘅溫度。水量需大於 0g（最多 3,000g）。';
    else if(hot<=room) error='熱水溫度必須高於室溫水溫度。';
    else if(target<room||target>hot) error=`目標水溫需介乎 ${fmt(room)}°C 至 ${fmt(hot)}°C，先可以用呢兩份水溝出。`;
    find('#mix-error').hidden=!error; find('#mix-error').textContent=error;
    find('#mix-result').hidden=!!error; find('#mix-apply').disabled=!!error;
    if(error){result=null;return}
    const fraction=(target-room)/(hot-room), hotGrams=Math.round(mass*fraction*10)/10;
    const roomGrams=Math.round((mass-hotGrams)*10)/10;
    result={mass,target,hot,room,hotGrams,roomGrams};
    find('#mix-result').innerHTML=`<div class="mix-result-title">沖出約 ${fmt(mass)}g · ${fmt(target)}°C 嘅水</div><div class="mix-amounts"><div><span>熱水 · ${fmt(hot)}°C</span><strong>${fmt(hotGrams)}<small> g</small></strong><em>${fmt(fraction*100)}%</em></div><b>＋</b><div><span>室溫水 · ${fmt(room)}°C</span><strong>${fmt(roomGrams)}<small> g</small></strong><em>${fmt((1-fraction)*100)}%</em></div></div><div class="mix-bar" aria-hidden="true"><span style="width:${fraction*100}%"></span></div><p class="mix-pour">${hotGrams===0?'只需室溫水。':roomGrams===0?'只需熱水。':`預熱容器後歸零 → 倒入熱水至 <b>${fmt(hotGrams)}g</b> → 不歸零，加室溫水至磅上 <b>${fmt(mass)}g</b>。`}</p>`;
    dialog.querySelectorAll('[data-mix-temp]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.mixTemp)===target));
  }
  function open() {
    if($('#editor').open){find('#mix-mass').value=form.elements.water.value;find('#mix-target').value=form.elements.temp.value}
    calculate(); dialog.showModal();
    find('#mix-apply-hint').textContent=$('#editor').open?'只更新水量與水溫；分段水量可再調整':'帶入一杯新沖煮紀錄';
  }
  navButton.onclick=open; inlineButton.onclick=open;
  find('#mix-close').onclick=()=>dialog.close();
  find('#mix-form').oninput=calculate;
  dialog.addEventListener('click',e=>{const b=e.target.closest('[data-mix-temp]');if(b){find('#mix-target').value=b.dataset.mixTemp;calculate()}});
  find('#mix-form').onsubmit=e=>{
    e.preventDefault();calculate();if(!result)return;
    const {mass,target,hot,room,hotGrams,roomGrams}=result;
    dialog.close();if(!$('#editor').open)openBrew();
    form.elements.water.value=mass;form.elements.temp.value=target;ratio();
    if(form.elements.tempSource)form.elements.tempSource.value='estimated';
    if(typeof updateSummary==='function'&&$('#stage-summary'))updateSummary();
    try{localStorage.setItem('slowbrew-water-temps',JSON.stringify({hot,room}))}catch{}
    toast(`已帶入 ${fmt(mass)}g / ${fmt(target)}°C：熱水 ${fmt(hotGrams)}g ＋ 室溫水 ${fmt(roomGrams)}g`);
  };
  try{const saved=JSON.parse(localStorage.getItem('slowbrew-water-temps')||'null');if(saved){find('#mix-hot').value=saved.hot;find('#mix-room').value=saved.room}}catch{}
})();
