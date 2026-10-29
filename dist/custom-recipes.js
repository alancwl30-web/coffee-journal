// Custom recipes share the existing per-account durable sync queue, not brew statistics.
(() => {
  let recipeMode=false, recipeId=null;
  const bean=form.elements.bean, beanLabel=bean.closest('label');
  const title=form.querySelector('.dialog-head h2'), eyebrow=form.querySelector('.dialog-head small');
  const submit=form.querySelector('[type="submit"]'), footer=form.querySelector('.form-bottom span');
  const brewOnly=[form.elements.date.closest('label'),$('#ratings'),$('#ratings').previousElementSibling,form.querySelector('.taste-preferences'),form.elements.notes.closest('label')].filter(Boolean);
  const original={title:title.textContent,eyebrow:eyebrow.textContent,submit:submit.textContent,footer:footer.textContent,placeholder:bean.placeholder};
  function mode(on){
    recipeMode=on;form.classList.toggle('recipe-editing',on);window.coffeeRecipeModeChanged?.(on);
    title.textContent=on?(recipeId?'修改自訂食譜':'新增自訂食譜'):original.title;
    eyebrow.textContent=on?'MY RECIPE':original.eyebrow;
    beanLabel.firstChild.textContent=on?'食譜名稱':'咖啡豆';bean.placeholder=on?'例如：我的 Switch 甜感配方':original.placeholder;
    submit.textContent=on?'儲存到食譜收藏 ↗':original.submit;
    footer.textContent=on?'登入後同步；未登入只存此瀏覽器':original.footer;
    brewOnly.forEach(el=>{el.hidden=on});form.elements.date.disabled=on;
    form.elements.notes.closest('label').hidden=false;
    form.elements.notes.closest('label').firstChild.textContent=on?'食譜說明（選填）':'風味與下次想改嘅地方';
  }
  const previousOpen=openBrew;openBrew=function(r){recipeId=null;mode(false);previousOpen(r)};
  window.refreshCustomRecipes=()=>{
    const select=$('#preset'),value=select.value;
    select.querySelectorAll('[data-custom-option]').forEach(o=>o.remove());
    customRecipes.forEach(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=r.title+' · '+(window.CoffeeI18n?.t('自訂')||'自訂');o.dataset.customOption='true';o.setAttribute('translate','no');select.append(o)});
    if([...select.options].some(o=>o.value===value))select.value=value;
  };
  const previousPreset=$('#preset').onchange;$('#preset').onchange=e=>{previousPreset(e);const r=customRecipes.find(x=>x.id===e.target.value);if(r){stages=r.stages.map(s=>stepDefaults(s));renderStages()}};
  window.saveCustomRecipe=r=>{
    if(!recipeMode)return false;
    const saved={id:recipeId||'recipe-'+(crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('')),_customRecipe:true,title:r.bean,author:'我的自訂食譜',desc:r.notes||'',source:'',method:r.method,dose:r.dose,water:r.water,temp:r.temp,clicks:r.clicks,seconds:r.seconds,drinkStyle:r.drinkStyle||'hot',ice:Number(r.ice||0),steps:stages.map(s=>`${s.start} ${s.action}${s.action==='注水'?' +'+s.water+'g':''}${s.next==='指定時間'?' · 等至 '+s.until:' · '+s.next}${s.note?' · '+s.note:''}`).join('\n')+(r.steps?'\n'+r.steps:''),waterSource:r.waterSource||'',waterMix:r.waterMix||'',supplementalSteps:r.steps||'',date:localTime(),stages:stages.map(s=>({...s,actualWater:'',actualTime:'',actualTemp:''}))};
    const next=recipeId?customRecipes.map(x=>x.id===recipeId?saved:x):[saved,...customRecipes];
    if(!saved.stages.length){toast('請至少加入一段沖煮流程，方便日後按粉量調整');return true}
    if(!window.coffeeCloud?.persist([...records,...next,...extras],true))return true;
    $('#editor').close();page='recipes';render();toast('已儲存食譜；請留意頁頂同步狀態');return true;
  };
  const previousRender=render;render=function(){previousRender();if(page!=='recipes')return;
    customRecipes.forEach(r=>{const use=document.querySelector(`[data-recipe="${r.id}"]`);if(!use)return;const edit=document.createElement('button');edit.type='button';edit.className='scale-inline';edit.dataset.editRecipe=r.id;edit.textContent='修改食譜';use.after(edit)});
  };
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-add-recipe')){openBrew();recipeId=null;mode(true)}
    if(b.dataset.editRecipe){const r=customRecipes.find(x=>x.id===b.dataset.editRecipe);if(!r)return;openBrew(r);recipeId=r.id;mode(true);bean.value=r.title;form.elements.notes.value=r.desc;form.elements.steps.value=r.supplementalSteps||''}
  });
  const css=document.createElement('style');css.textContent='[hidden]{display:none!important}.recipe-editing #stage-list details .fields{display:none}.recipe-editing .scale-provenance{display:none}';document.head.append(css);
  window.addEventListener('coffee-language-change',()=>refreshCustomRecipes());
  refreshCustomRecipes();render();
})();
