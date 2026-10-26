// Deliberately conservative rules; no remote API or claim of proven causation.
function brewAdvice(current, baseline) {
  const n = v => Number.isFinite(Number(v)) && v !== '' && v != null;
  const suggestion=(field,value,reason)=>({field,value,reason,from:Number(current[field])});
  if(current.prefAcid==='high'&&['bitter','astringent'].includes(current.prefBitter))return {message:'同時太酸又太苦／澀，單靠研磨方向未能判斷。先比較滿意嘅配方，核對流速、注水均勻度及豆本身風味。'};
  if(current.prefAcid==='high') {
    if(!n(current.clicks)||Number(current.clicks)<3)return {message:'先核對 C40 格數及流程；現有資料不足以提供合適嘅磨細建議。'};
    const reason=baseline&&n(baseline.acid)&&n(current.acid)&&baseline.acid<current.acid&&Number(current.clicks)>Number(baseline.clicks)
      ?'比較嗰杯酸感較低，亦磨得較細。先只磨細 2 格，保留其他設定，觀察酸感同甜感。'
      :'太酸可能涉及萃取、豆本身風味或水質。先只磨細 2 格作小試驗，觀察酸感同甜感，唔保證一定改善。';
    return suggestion('clicks',Number(current.clicks)-2,reason);
  }
  if(current.prefBitter==='bitter'||current.prefBitter==='astringent') {
    if(!n(current.clicks)||Number(current.clicks)>98)return {message:'先核對研磨格數；亦可記低注水攪動、濾紙及流速，方便再比較。'};
    return suggestion('clicks',Number(current.clicks)+2,'先只磨粗 2 格，觀察苦感／澀感有冇減少。亦可能同豆本身、攪動或水質有關，呢個係試驗方向。');
  }
  if(current.prefStrength==='weak'&&n(current.dose)&&Number(current.dose)<200)return suggestion('dose',Math.round((Number(current.dose)+1)*10)/10,'想濃少少，可以先加 1g 咖啡粉，保持總水量及注水流程，觀察濃度同口感。');
  if(current.prefStrength==='strong'&&n(current.dose)&&Number(current.dose)>1)return suggestion('dose',Math.max(1,Math.round((Number(current.dose)-1)*10)/10),'想淡少少，可以先減 1g 咖啡粉，保持總水量及注水流程，觀察濃度同口感。');
  if(current.prefSweet==='more'&&n(current.clicks)&&Number(current.clicks)>=3)return suggestion('clicks',Number(current.clicks)-2,'想再甜啲，先只試磨細 2 格。甜感亦受豆同烘焙影響；下杯一併留意有冇增加苦澀。');
  if([current.prefAcid,current.prefStrength,current.prefBitter,current.prefSweet].some(v=>v==='right')&&current.prefAcid!=='low')return {message:'你已標示部分口味啱啱好，暫時冇需要調整嘅項目。可以重沖滿意嘅配方；其他口味偏好亦可隨時補填。'};
  return {message:current.prefAcid==='low'?'想增加酸感，先比較你曾經鍾意嘅配方。只憑酸感低，暫時唔指定改研磨或水溫。':'先填「酸度、濃淡、苦澀、甜感啱唔啱自己」，再提供一個小調整；亦可以直接重沖最滿意嗰杯。'};
}
if(typeof module!=='undefined')module.exports={brewAdvice};
