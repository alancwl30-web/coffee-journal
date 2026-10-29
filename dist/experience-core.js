// Pure transformations shared by browser flows and regression checks.
(function(root){
 const auxiliary=r=>!!(r._customRecipe||r._beanProfile||r._preferences);
 const split=rows=>({records:rows.filter(r=>!auxiliary(r)),recipes:rows.filter(r=>r._customRecipe),extras:rows.filter(r=>r._beanProfile||r._preferences)});
 const remaining=(bean,records)=>{const used=records.filter(r=>r.beanId===bean.id&&!r.demo).reduce((n,r)=>n+(Number(r.dose)||0),0);return bean.weight==null||bean.weight===''?null:Math.round((Number(bean.weight)-used)*10)/10};
 const stageCopy=stages=>(stages||[]).map(s=>({...s,actualWater:'',actualTime:'',actualTemp:''}));
 function rebrew(r){const next=JSON.parse(JSON.stringify(r));for(const k of ['id','demo','rating','sweet','acid','bitter','body','prefAcid','prefStrength','prefBitter','prefSweet','actualWater','actualTemp','actualSeconds','timerSessionId','experiment','trialResult','date','finishedAt'])delete next[k];next.notes='';next.stages=stageCopy(r.stages);return next}
 function recipeFromBrew(r,id,title){return {id,_customRecipe:true,title,author:'我的自訂食譜',desc:'由沖煮紀錄收藏',source:'',method:r.method,dose:Number(r.dose),water:Number(r.water),temp:Number(r.temp),clicks:Number(r.clicks),seconds:Number(r.seconds),drinkStyle:r.drinkStyle||'hot',ice:Number(r.ice||0),steps:r.steps||'',waterSource:r.waterSource||'',waterMix:r.waterMix||'',stages:stageCopy(r.stages),supplementalSteps:''}}
 const elapsed=(timer,now)=>Math.max(0,(Number(timer.elapsedMs)||0)+(timer.running?Math.max(0,now-timer.startedAt):0));
 const time=t=>/^\d{1,3}:[0-5]\d$/.test(t||'')?Number(t.split(':')[0])*60+Number(t.split(':')[1]):null;
 function validatePlan(r){if(!String(r.bean||'').trim())throw Error('請先選擇或填寫咖啡豆。');if(!r.stages?.length)throw Error('請至少加入一段沖煮流程。');let last=-1,total=0;for(const s of r.stages){const start=time(s.start);if(start===null||start<last)throw Error('請按先後次序填每段開始時間。');last=start;if(s.next==='指定時間'&&(time(s.until)===null||time(s.until)<start))throw Error('每段「等至」不可早於開始時間。');if(s.action==='注水'){if(!Number.isFinite(Number(s.water))||Number(s.water)<=0)throw Error('每段注水必須大於 0g。');total+=Number(s.water)}}if(Math.abs(total-Number(r.water))>.05)throw Error('請先對齊分段注水與總注水量。');return true}
 const api={auxiliary,split,remaining,stageCopy,rebrew,recipeFromBrew,elapsed,time,validatePlan};if(typeof module!=='undefined')module.exports=api;else root.CoffeeExperienceCore=api;
})(typeof window==='undefined'?{}:window);
