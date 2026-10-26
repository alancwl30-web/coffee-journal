(() => {
  const prefix='slowbrew-cloud-v1:', legacyKey='slowbrew-v1';
  let appUI, core, sdk, user=null, state=null, unsubscribe=null, epoch=0, phase='loading', lastError='', serverSeen=false, importing=false;
  const flights=new Map();let stopAuth=null;
  const panel=document.createElement('section');panel.id='cloud-panel';panel.setAttribute('aria-label','帳戶與雲端同步');
  panel.innerHTML='<div class="cloud-heading"><div><b id="cloud-account">正在啟動帳戶同步…</b><p id="cloud-status" role="status" aria-live="polite">本機紀錄保留，尚未開始雲端同步。</p></div><div class="cloud-actions"><button type="button" id="cloud-login" disabled>用 Google 登入</button><button type="button" id="cloud-logout" hidden>登出</button><button type="button" id="cloud-retry" hidden>重試連線</button><button type="button" id="cloud-check" hidden>測試雲端讀寫</button><button type="button" id="cloud-local" hidden>繼續只存本機</button></div></div><p id="cloud-error" role="alert" hidden></p><p id="cloud-check-result" role="status" hidden></p><div id="cloud-import" hidden><p>呢個瀏覽器有未搬上雲端嘅舊紀錄。只會喺你按掣後加入目前登入帳戶。</p><button type="button" id="cloud-import-button">將本機舊紀錄加入呢個帳戶</button></div>';
  document.querySelector('header').after(panel);
  document.querySelector('.local-badge').textContent='● 個人沖煮日誌';
  document.querySelector('footer span').textContent='Google 登入後同步 · 未登入只存本機';
  const link=document.createElement('link');link.rel='stylesheet';link.href='cloud.css';document.head.append(link);
  const find=id=>document.getElementById(id);
  function legacy(){try {const rr=JSON.parse(localStorage.getItem(legacyKey)||'[]');return Array.isArray(rr)?rr.filter(r=>!r.demo):[]}catch{return []}}
  function message(error) {
    const code=String(error?.code||'');
    if(code.includes('permission-denied'))return '雲端拒絕存取；請檢查 Firestore 規則。未同步紀錄仍保留喺此瀏覽器。';
    if(code.includes('unauthorized-domain'))return '呢個網站網域未獲 Firebase 授權登入，請聯絡網站管理者。';
    if(code.includes('popup-blocked'))return '瀏覽器封鎖咗登入視窗；請允許此網站彈出視窗，再按 Google 登入。';
    if(code.includes('popup-closed')||code.includes('cancelled-popup'))return '登入未完成；你可以再按 Google 登入。';
    if(code.includes('network')||code.includes('unavailable'))return '暫時連唔到雲端，請檢查網絡；本機待同步紀錄會保留。';
    return '未能完成同步：'+(error?.message||'請重試連線。');
  }
  function updateStatus() {
    const signed=!!user, pending=state?Object.keys(state.pending).length:0;
    find('cloud-account').textContent=signed?`${user.displayName||'Google 帳戶'} · ${user.email||''}`:phase==='loading'?'正在啟動帳戶同步…':'跨裝置記錄每一杯';
    find('cloud-login').hidden=signed;find('cloud-login').disabled=phase==='loading'||!sdk;
    find('cloud-check').hidden=!signed;find('cloud-logout').hidden=!signed;find('cloud-logout').disabled=phase==='loading';
    find('cloud-retry').hidden=!lastError&&!signed;find('cloud-local').hidden=phase!=='failed';
    find('cloud-error').hidden=!lastError;find('cloud-error').textContent=lastError;
    find('cloud-import').hidden=!signed||!legacy().length;
    find('cloud-import-button').disabled=importing||!serverSeen;
    let status='只存本機 · 登入同一個 Google 帳戶後，可喺其他裝置讀返紀錄。';
    if(phase==='loading')status='正在確認登入狀態；完成前暫時未能儲存。';
    else if(signed)status=lastError?`同步失敗${pending?' · '+pending+' 杯保留喺本機等待重試':''}`:pending?`${navigator.onLine?'儲存中':'離線，等待同步'} · ${pending} 杯已保留喺此瀏覽器`:!navigator.onLine?'離線 · 顯示本機副本':serverSeen?'已同步至雲端':'正在讀取雲端紀錄…';
    find('cloud-status').textContent=status;panel.dataset.state=lastError?'error':pending?'pending':signed&&serverSeen?'synced':'local';
  }
  function durable(next) {localStorage.setItem(prefix+next.uid,JSON.stringify(next));state=next;}
  function currentDisk(){return core.readState(localStorage.getItem(prefix+user.uid),user.uid)}
  function publishRows(){if(appUI)appUI.replaceRecords(state?state.records:legacy())}
  function attachListener() {
    unsubscribe?.();const myEpoch=epoch, uid=user.uid;
    unsubscribe=sdk.onSnapshot(sdk.collection(sdk.db,'users',uid,'brews'),{includeMetadataChanges:true}, snapshot=>{
      if(myEpoch!==epoch||user?.uid!==uid)return;
      try {
        const fresh=currentDisk();
        const remote=snapshot.docs.map(d=>({id:d.id,data:d.data(),pending:d.metadata.hasPendingWrites}));
        durable(core.mergeSnapshot(fresh,remote,!snapshot.metadata.fromCache));
        if(!snapshot.metadata.fromCache){serverSeen=true;lastError=''}
        publishRows();updateStatus();flush();
      }catch(error){lastError=message(error);updateStatus()}
    }, error=>{if(myEpoch===epoch){lastError=message(error);updateStatus()}});
  }
  function flush() {
    if(!sdk||!user||!state||!navigator.onLine||phase!=='ready')return;
    const uid=user.uid, myEpoch=epoch;
    for(const [id,p] of Object.entries(state.pending)) {
      const flight=uid+':'+id;if(flights.has(flight))continue;
      flights.set(flight,p.token);
      const slow=setTimeout(()=>{if(myEpoch===epoch&&state?.pending[id]?.token===p.token){lastError='暫時未收到雲端儲存確認；紀錄已留喺本機，恢復連線後會再同步。';updateStatus()}},15000);
      sdk.setDoc(sdk.doc(sdk.db,'users',uid,'brews',id),{...p.record,_syncToken:p.token,_updatedAt:sdk.serverTimestamp()})
        .then(()=>{
          // Never update the newly selected account using an old request's result.
          if(myEpoch!==epoch||user?.uid!==uid)return;
          durable(core.acknowledge(currentDisk(),id,p.token));lastError='';updateStatus();
        }).catch(error=>{if(myEpoch===epoch){lastError=message(error);updateStatus()}})
        .finally(()=>{clearTimeout(slow);flights.delete(flight);if(myEpoch===epoch&&user?.uid===uid&&state.pending[id]&&state.pending[id].token!==p.token)flush()});
    }
  }
  window.coffeeCloud={
    persist(next) {
      if(phase==='loading'||phase==='failed'){toast('帳戶同步未準備好；請重試連線或揀「繼續只存本機」。');return false}
      if(!user){try{localStorage.setItem(legacyKey,JSON.stringify(next));appUI.replaceRecords(next);updateStatus();return true}catch{toast('本機儲存失敗，請先匯出備份。');return false}}
      try {
        if(phase!=='ready'||!state)throw new Error('帳戶資料未準備好，請稍後再儲存。');
        const staged=core.queueChanges(currentDisk(),appUI.getRecords(),next,()=>crypto.randomUUID());
        durable(staged);appUI.replaceRecords(state.records);updateStatus();flush();return true;
      }catch(error){toast(message(error));return false}
    },
    savedMessage(){return user?'已保留喺本機，請留意頁頂同步狀態 ☕':'已儲存喺此瀏覽器（未同步） ☕'}
  };
  async function connect() {
    phase='loading';lastError='';updateStatus();
    try {
      [core,sdk]=await Promise.all([import('./cloud-core.mjs'),import('./firebase-sdk.mjs')]);
      await sdk.setPersistence(sdk.auth,sdk.browserLocalPersistence);
      stopAuth?.();stopAuth=sdk.onAuthStateChanged(sdk.auth, nextUser=>{
        epoch++;unsubscribe?.();unsubscribe=null;serverSeen=false;lastError='';
        appUI.closeAccountViews();find('cloud-check-result').hidden=true;user=nextUser;state=null;phase='ready';
        if(user){try{state=currentDisk();publishRows();attachListener();flush()}catch(error){phase='failed';lastError=message(error);appUI.replaceRecords([])}}
        else publishRows();updateStatus();
      },error=>{phase='failed';lastError=message(error);updateStatus()});
    } catch(error){phase='failed';lastError=message(error);updateStatus()}
  }
  find('cloud-login').onclick=async()=>{
    if(!sdk)return;lastError='';find('cloud-login').disabled=true;
    try{const provider=new sdk.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await sdk.signInWithPopup(sdk.auth,provider)}
    catch(error){lastError=message(error)}finally{updateStatus()}
  };
  find('cloud-check').onclick=async()=>{
    if(!user||!sdk)return;
    const uid=user.uid,myEpoch=epoch,marker=crypto.randomUUID(),button=find('cloud-check'),output=find('cloud-check-result');
    button.disabled=true;output.hidden=false;output.textContent='正在測試讀寫；診斷資料不計入沖煮紀錄。';
    try {
      await sdk.setDoc(sdk.doc(sdk.db,'users',uid,'brews','__connection_check'),{_systemTest:true,_syncToken:marker,_updatedAt:sdk.serverTimestamp()});
      const snapshot=await sdk.getDocsFromServer(sdk.collection(sdk.db,'users',uid,'brews'));
      if(myEpoch!==epoch)return;
      if(!snapshot.docs.some(d=>d.id==='__connection_check'&&d.data()._syncToken===marker))throw new Error('未能確認伺服器讀回測試資料。');
      output.textContent='雲端讀寫測試通過：已寫入香港 Firestore，並由伺服器讀回確認。診斷資料不計入沖煮紀錄。';
    }catch(error){if(myEpoch===epoch)output.textContent='讀寫測試未完成：'+message(error)}finally{button.disabled=false}
  };
  find('cloud-logout').onclick=async()=>{try{await sdk.signOut(sdk.auth);toast('已登出；待同步紀錄仍保留喺原帳戶嘅本機副本。')}catch(error){lastError=message(error);updateStatus()}};
  find('cloud-retry').onclick=()=>{if(phase==='loading'){location.reload();return}if(sdk&&user&&state){lastError='';attachListener();flush();updateStatus()}else if(!sdk)connect();else location.reload()};
  find('cloud-local').onclick=()=>{if(user){lastError='此帳戶本機資料需先修復，請先匯出備份；登出後先可用未登入模式。';updateStatus();return}phase='ready';lastError='';publishRows();updateStatus()};
  find('cloud-import-button').onclick=async()=>{
    if(!user||!serverSeen||importing)return;importing=true;updateStatus();
    const uid=user.uid,myEpoch=epoch;
    try {
      // Check the server first. Existing cloud IDs always win; import never replaces them.
      const snapshot=await sdk.getDocsFromServer(sdk.collection(sdk.db,'users',uid,'brews'));
      if(myEpoch!==epoch||user?.uid!==uid)return;
      const fresh=currentDisk(),known=new Set([...snapshot.docs.map(d=>d.id),...fresh.records.map(r=>r.id)]);
      const additions=legacy().filter(r=>!known.has(r.id));
      if(!additions.length){toast('舊紀錄已經喺呢個帳戶，唔會重複加入。');return}
      durable(core.queueChanges(fresh,[],additions,()=>crypto.randomUUID()));publishRows();flush();toast('已加入 '+additions.length+' 杯，請留意同步狀態；本機原檔保留。');
    }catch(error){lastError=message(error)}finally{importing=false;updateStatus()}
  };
  window.addEventListener('online',()=>{if(user){lastError='';flush()}updateStatus()});window.addEventListener('offline',updateStatus);
  window.addEventListener('storage',event=>{if(user&&event.key===prefix+user.uid){try{state=currentDisk();publishRows();updateStatus();flush()}catch(error){lastError=message(error);updateStatus()}}});
  window.startCoffeeCloud = ui => {appUI=ui;connect()};
  setTimeout(()=>{if(phase==='loading'){lastError='連線需時，請檢查網絡；未完成前唔會顯示為已同步。';find('cloud-retry').hidden=false;updateStatus()}},15000);
})();
