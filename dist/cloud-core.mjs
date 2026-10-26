// No Firebase/browser dependency: deterministic durable outbox and merge rules.
export const copy = value => JSON.parse(JSON.stringify(value));
export const validId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,180}$/.test(id);
export function emptyState(uid) { return {version:1,uid,records:[],pending:{}}; }
export function readState(raw, uid) {
  if (!raw) return emptyState(uid);
  const s=JSON.parse(raw);
  if (s.version!==1 || s.uid!==uid || !Array.isArray(s.records) || !s.pending || typeof s.pending!=='object') throw new Error('本機同步資料格式有問題；請先匯出備份。');
  return copy(s);
}
export function queueChanges(state, before, next, makeToken) {
  const s=copy(state), old=new Map(before.map(r=>[r.id,r]));
  const byId=new Map(s.records.map(r=>[r.id,r]));
  for (const r of next) {
    if (r.demo) continue;
    if (!validId(r.id)) throw new Error('紀錄 ID 格式不正確，未能儲存。');
    if (JSON.stringify(old.get(r.id))===JSON.stringify(r)) continue;
    const record=copy(r); delete record._syncToken; delete record._updatedAt;
    byId.set(record.id,record);
    s.pending[record.id]={record,token:makeToken()};
  }
  // Absence from a stale tab never deletes someone else's cloud record.
  s.records=[...byId.values()]; return s;
}
export function mergeSnapshot(state, remote, authoritative) {
  const s=copy(state), rows=new Map((authoritative?[]:s.records).map(r=>[r.id,r]));
  for (const doc of remote) {
    if (!validId(doc.id) || (doc.id==='__connection_check' && doc.data._systemTest===true)) continue;
    const record={...copy(doc.data),id:doc.id}; delete record._syncToken; delete record._updatedAt;
    rows.set(doc.id,record);
    if (authoritative && !doc.pending && s.pending[doc.id]?.token===doc.data._syncToken) delete s.pending[doc.id];
  }
  for (const [id,p] of Object.entries(s.pending)) rows.set(id,copy(p.record));
  s.records=[...rows.values()].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||a.id.localeCompare(b.id));
  return s;
}
export function acknowledge(state,id,token) {
  const s=copy(state); if (s.pending[id]?.token===token) delete s.pending[id]; return s;
}
