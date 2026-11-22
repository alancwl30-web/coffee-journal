(function(root){
 const round=n=>Math.round((n+Number.EPSILON)*10)/10;
 function scale(r,factor,lockMilk=false){if(!Number.isFinite(factor)||factor<=0||factor>20)throw Error('請填有效份量。');const n={...r};for(const k of ['powder','water','milk','ice','sweetener'])n[k]=round(Number(r[k]||0)*(k==='milk'&&lockMilk?1:factor));validate(n);return n}
 function validate(r){if(!String(r.title||'').trim())throw Error('請填抹茶名稱。');for(const [k,max]of [['powder',100],['water',3000],['milk',3000],['ice',3000],['sweetener',500]])if(!Number.isFinite(Number(r[k]))||Number(r[k])<0||Number(r[k])>max)throw Error('請檢查材料用量。');if(Number(r.powder)<=0||Number(r.water)<=0||!Number.isFinite(Number(r.temp))||r.temp<=0||r.temp>100)throw Error('請填有效粉量、水量及水溫。');if(!Number.isFinite(Number(r.whiskSeconds))||r.whiskSeconds<0||r.whiskSeconds>3600)throw Error('請檢查打茶時間。');return r}
 const remaining=(tin,rows)=>tin.weight===''||tin.weight==null?null:round(Number(tin.weight)-rows.filter(r=>r.kind==='drink'&&!r._deleted&&r.tinId===tin.id).reduce((n,r)=>n+Number(r.powder||0),0));
 const recipe=(r,id)=>{const n={...r,id,kind:'recipe'};for(const k of ['date','rating','strength','bitterness','sweetness','smoothness','clumps','milkBalance','notes','actualSeconds'])delete n[k];return n};
 const rebrew=r=>{const n=recipe(r,'');delete n.id;n.kind='drink';return n};
 const compare=(a,b)=>['powder','water','milk','temp','whiskSeconds','rating'].map(key=>({key,before:a[key]??'',after:b[key]??''}));
 const api={scale,validate,remaining,recipe,rebrew,compare};if(typeof module!=='undefined')module.exports=api;else root.MatchaCore=api;
})(typeof window==='undefined'?{}:window);
