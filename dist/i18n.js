// Presentation-only localisation. Storage keys, enum values and form values stay canonical.
function createCoffeeTranslator(dictionary) {
 const reverse=new Map(Object.entries(dictionary).map(([zh,en])=>[en,zh]));
 const keys=Object.keys(dictionary).filter(k=>k.length>1).sort((a,b)=>b.length-a.length);
 const escaped=keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 const pattern=new RegExp(escaped.join('|'),'g');
 function canonical(value){return reverse.get(value)||value}
 function en(value){if(dictionary[value])return dictionary[value];let text=value;
  text=text.replace(/第\s*(\d+)\s*[/／]\s*(\d+)\s*段/g,'Step $1 / $2').replace(/第\s*(\d+(?:[、，]\d+)*)\s*段/g,(_,n)=>'Step '+n.replace(/[、，]/g,', '));
  text=text.replace(/([\d,.]+)\s*杯已連結/g,'$1 linked brews').replace(/([\d,.]+)\s*次注水/g,'$1 pours').replace(/([\d,.]+)\s*杯紀錄/g,'$1 brews').replace(/([\d,.]+)\s*杯/g,'$1 brews').replace(/([\d,.]+)\s*款/g,'$1 coffees').replace(/([\d,.]+)\s*段/g,'$1 steps').replace(/([\d,.]+)\s*格/g,'$1 clicks');
  text=text.replace(/距離參考時間\s*([\d:]+)/g,'Reference countdown $1').replace(/參考開始\s*([\d:]+)/g,'Reference start $1').replace(/壺初始\s*([\d.]+)°C/g,'Kettle initially $1°C').replace(/混合平衡溫度先以\s*([\d.]+)°C\s*為目標。/g,'Aim for $1°C at mixing equilibrium.').replace(/已將額外散熱補償設為\s*([\d.]+)°C；請以相同方法再測試。/g,'Extra heat-loss compensation set to $1°C. Repeat the test with the same method.').replace(/可連結\s*(\d+)\s*筆未連結紀錄；勾選後先會加入呢包豆。/g,'$1 unlinked records can be linked. They will only be added if you check the box.').replace(/已匯出\s*(\d+)\s*杯紀錄/g,'Exported $1 brews').replace(/已加入\s*(\d+)\s*筆/g,'Added $1 records').replace(/([\d,.]+)g 注水/g,'$1g brewing water').replace(/([\d,.]+)\s*秒/g,'$1 sec').replace(/([\d,.]+)g 粉/g,'$1g coffee').replace(/([\d,.]+)g 水/g,'$1g water').replace(/· 低/g,'· Low').replace(/· 高/g,'· High');
  return text.replace(pattern,k=>dictionary[k]).replace(/([.!?])(?=[A-Z])/g,'$1 ').replace(/[，、]/g,', ').replace(/；/g,'; ').replace(/｜/g,' | ').replace(/（/g,' (').replace(/）/g,')').replace(/\b1 pours\b/g,'1 pour').replace(/\b1 brews\b/g,'1 brew').replace(/\b1 coffees\b/g,'1 coffee');
 }
 return {canonical,en,translate:(value,language)=>language==='en'?en(canonical(value)):canonical(value)};
}
if(typeof module!=='undefined')module.exports={createCoffeeTranslator};
if(typeof document!=='undefined')(()=>{
 let language='zh-Hant';try{language=localStorage.getItem('slowbrew-language')==='en'?'en':'zh-Hant'}catch{}
 let translator=createCoffeeTranslator({}),ready=false,observer,updating=false;
 const originals=new WeakMap(),attributeOriginals=new WeakMap(),validationOriginals=new WeakMap(),frozenOptions=new WeakSet();
 const skipped=el=>!el||!!el.closest('script,style,textarea,[translate="no"],[data-language-picker]');
 function textNode(node){if(skipped(node.parentElement))return;const current=node.nodeValue;let entry=originals.get(node);if(!entry||entry.last!==current)entry={source:translator.canonical(current),last:current};const output=translator.translate(entry.source,language);entry.last=output;originals.set(node,entry);if(output!==current)node.nodeValue=output}
 function attributes(el){if(skipped(el))return;if(el.tagName==='OPTION'&&!frozenOptions.has(el)){if(!el.hasAttribute('value'))el.setAttribute('value',el.value);frozenOptions.add(el)}
  if(el.validity?.customError){const current=el.validationMessage;let entry=validationOriginals.get(el);if(!entry||entry.last!==current)entry={source:translator.canonical(current),last:current};const output=translator.translate(entry.source,language);entry.last=output;validationOriginals.set(el,entry);if(current!==output)el.setCustomValidity(output)}
  const entries=attributeOriginals.get(el)||{};for(const name of ['placeholder','aria-label','title']){const current=el.getAttribute(name);if(current===null)continue;let entry=entries[name];if(!entry||entry.last!==current)entry={source:translator.canonical(current),last:current};const output=translator.translate(entry.source,language);entry.last=output;entries[name]=entry;if(output!==current)el.setAttribute(name,output)}attributeOriginals.set(el,entries);
 }
 function addPicker(host){if(host.querySelector('[data-language-picker]'))return;const label=document.createElement('label');label.className='language-switch';label.dataset.languagePicker='true';label.setAttribute('translate','no');label.innerHTML='<span>Language / 語言</span><select aria-label="Language / 語言"><option value="zh-Hant" lang="zh-Hant">繁體中文</option><option value="en" lang="en">English</option></select>';host.append(label);const select=label.querySelector('select');select.value=language;for(const o of select.options)o.defaultSelected=o.value===language;select.addEventListener('change',e=>{e.stopPropagation();setLanguage(select.value)})}
 function updatePickers(){document.querySelectorAll('[data-language-picker] select').forEach(s=>{s.value=language;for(const o of s.options)o.defaultSelected=o.value===language})}
 function observe(){observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']})}
 function apply(root=document.body){if(!ready||updating||!root)return;updating=true;observer?.disconnect();try{
   if(root.nodeType===3){textNode(root);return}
   if(root.nodeType!==1)return;
   if(root.matches('header,.dialog-head'))addPicker(root);root.querySelectorAll('header,.dialog-head').forEach(addPicker);
   attributes(root);root.querySelectorAll('input,select,textarea,option,[placeholder],[aria-label],[title]').forEach(attributes);
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(textNode);
  }finally{updating=false;if(observer)observe()}}
 function setLanguage(value){language=value==='en'?'en':'zh-Hant';try{localStorage.setItem('slowbrew-language',language)}catch{}document.documentElement.lang=language;document.title=language==='en'?'Slow Brew · Coffee Journal':'慢慢沖 · Coffee Journal';updatePickers();apply();updateDate();window.dispatchEvent(new CustomEvent('coffee-language-change',{detail:{language}}))}
 function updateDate(){const date=document.getElementById('date');if(date)date.textContent=new Intl.DateTimeFormat(language==='en'?'en-HK':'zh-HK',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date())}
 window.CoffeeI18n={get language(){return language},t:value=>translator.translate(String(value),language),setLanguage,apply};
 const css=document.createElement('link');css.rel='stylesheet';css.href='i18n.css';document.head.append(css);
 fetch(new URL('i18n-en.json',document.currentScript.src)).then(r=>{if(!r.ok)throw Error('Language file could not load');return r.json()}).then(dictionary=>{
  translator=createCoffeeTranslator(dictionary);ready=true;observer=new MutationObserver(records=>{const roots=new Set();for(const r of records){if(r.type==='childList')roots.add(r.target);else roots.add(r.type==='attributes'?r.target:r.target.parentElement)}for(const root of roots)if(root?.isConnected)apply(root)});setLanguage(language);observe();
 }).catch(()=>{document.documentElement.lang='zh-Hant';console.warn('English translations could not load; keeping the original interface.')});
})();
