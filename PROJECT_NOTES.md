# 慢慢沖 · Coffee Journal

## 新增：粕谷哲手法參考模板

四款模板：Hybrid / Devil、New Hybrid、Hybrid 冰咖啡、4:6 急冷冰咖啡。數值為本站參考改編，未經原作者影片逐項核實；原作者影片連結保留於每份模板。C40 格數為本站起點，不代表原作者設定。

每段注水支援獨立水溫。冰量在分享壺獨立記錄，不計入沖過咖啡粉的總注水；水加冰的材料重量不等於成品重量。熱／冰或冰量不同的紀錄不會自動混在同組建議比較。

手機優先的繁體中文咖啡沖煮日誌第一版。無需安裝依賴，靜態檔案位於 `dist/`，可部署於任何靜態網站服務。

## 功能

- 新增與編輯沖煮紀錄、日期時間、V60 / Hario Switch / 其他手法
- 粉量、水量、自動粉水比、水溫、Comandante C40 標準軸 clicks、總時間與自訂流程
- 整體滿意度、甜酸苦與厚實度；未評分與低分分開儲存
- 日常 V60、Switch 全浸泡、粕谷哲 4:6 參考食譜（附來源，格數是參考值）
- 咖啡豆搜尋、按器具篩選、同豆紀錄分組、JSON 匯出
- 示範資料明確標示，不計入個人統計

## 帳戶與雲端儲存（2026-10-26）

網站透過 Firebase Google 登入，讀寫 coffee-journal-342ba 的 Cloud Firestore。紀錄路徑為 users/{uid}/brews/{brewId}；firestore.rules 與控制台已發佈的規則一致。每個帳戶只能存取自己的紀錄。Google 登入與外層 ChatGPT 網站存取是兩個獨立步驟，現有 Sites 網址仍保留原本私人存取限制。

- 未登入：使用原本 slowbrew-v1 本機儲存，清楚標示未同步。
- 登入：每杯獨立寫入，接收即時快照；Google 帳戶相同即可跨裝置讀取。
- 本機待同步佇列按 UID 分開，儲存後即保留。網絡恢復、重試或重開網站後繼續送出。首次載入網站仍需要網絡；本版不是離線 PWA。
- 「已同步」需讀取過伺服器且沒有待送出紀錄；本機儲存不會當作雲端成功。錯誤提供重試與保留提示。
- 登出／換帳戶立即清空當前帳戶畫面並關閉相關對話框。原帳戶待同步紀錄仍留在該帳戶專用本機副本，重新登入該帳戶後重試。
- 舊紀錄不會自動搬到任何帳戶；需要按「將本機舊紀錄加入呢個帳戶」。匯入先檢查伺服器，同 ID 已存在就跳過，保留原本本機資料；離線時不能執行搬移。
- 同一杯由兩部裝置同時修改採最後成功寫入的版本；不提供欄位層級合併。不同杯紀錄互不覆蓋。
- 評分、分段溫度／冰量、換算來源及試驗回饋跟同一筆紀錄一起保存。
- 網頁 SDK 使用固定版本官方 Firebase CDN；沒有啟用 Analytics。網頁設定的 apiKey 是專案識別，存取權由 Authentication 與 Firestore rules 控制，不包含管理員私鑰。

搬到新網域時，需要在 Firebase Authentication 的授權網域新增該 hostname。Firebase Hosting 的預設網域已授權。

測試：`node test-cloud.mjs`、`node test-scale.cjs`、`node test-advice.cjs`、`node test-templates.cjs`。

## 按粉量調整（2026-10-26）

每款預設食譜及表單的「套用食譜」均可開啟換算。支援保留原粉水比或指定總注水，各段依原注水比例分配並精確對齊至 0.1g；冰量按粉量縮放且不計入注水。時間、水溫、研磨及閥門流程保留為參考，不預測換算後完成時間。調整結果另標示為按粉量調整版，保留原配方資訊，能隨紀錄儲存。

驗證：`node test-scale.cjs`、`node test-advice.cjs`、`node test-templates.cjs`。

登入後「測試雲端讀寫」會在個人 brews 下更新固定的 __connection_check 診斷文件，再從伺服器讀回確認；此文件不列入沖煮紀錄或統計。

## 分段溝水與壺身吸熱（2026-10-29）

食譜粉量換算及沖煮表單會按各段水量／水溫顯示溝水份量。可合併相同水溫一次準備，或逐段分開準備；分享壺冰及非注水段落不計入。熱水預設 100°C，室溫水 25°C，可修改。水量隨粉量換算；時間及溫度仍沿用參考。

開啟不鏽鋼壺修正後必須輸入空壺重。以水 4.18 J/g/K、304 不鏽鋼 0.50 J/g/K 估算熱平衡；不是實測保證。壺起始狀態可選室溫、預熱至目標＋補償、自訂；每批可覆蓋壺溫。重用暖壺不會自動推算溫度，請量度再輸入。整壺重量包含不直接接觸水的部件，可能高估吸熱。

計算：熱水 g = [水量 × (目標＋補償−室溫水溫) + 壺重 × (0.50 / 4.18) × (目標＋補償−壺初始溫度)] / (熱水溫度−室溫水溫)。停用壺修正時第二項為零。結果以 0.1g 四捨五入，冷水量由總量減去熱水量，確保總量一致。若所需熱水超過總量或小於零，顯示不可行原因。

額外散熱補償預設零，代表混合後至使用前預期跌溫。可用目標與實測溫度差更新原補償（0–15°C），只適用於相近操作，請重新量溫確認。未自動模擬空氣散熱、容器接觸範圍及等待時間。

設定會記在瀏覽器，亦隨儲存的沖煮／自訂食譜透過現有帳戶同步。安全規則不用改。所有畫面輸出均標為估算。物性參考：日本製鐵 SUS304，https://www.nipponsteel.com/product/stainless/list/stainless_steel_shapes/features/ 。

新增檢查：`node test-water-mix.cjs`（吸熱、預熱、補償、不可行目標、精度與多溫度分組）。

## Guided brewing, beans and quick logging (2026-10-29)

- A guided brew view shows the current action, added/cumulative water, stage temperature and Switch valve state. Steps require manual confirmation; timed reference points never automatically skip a pour or a wait-for-drawdown step. Pause/resume uses elapsed timestamps, not interval counts. Optional audio and screen wake lock are best effort; mobile lock-screen/background alerts are not guaranteed. Browser-local timer drafts are isolated per signed-in account (or anonymous mode) and can resume after reload. Timer drafts themselves do not sync between devices.
- On completion, actual elapsed seconds and entered per-pour measured water are carried into a new record. Blank measurements stay blank. Records include a session ID to guard against saving the same local timer session twice. Bean inventory changes only when the record is saved.
- Bean profiles have stable IDs per bag/batch, name, roaster, origin, process, roast level, roast/open dates and optional initial grams. Remaining grams are derived from linked saved brew records, so editing an existing record does not double-debit. Unknown consumption is not inferred. Negative stock is visibly flagged. Same-name bags are distinct; old name-only records are linked only through an explicit checkbox.
- Any saved brew can become a personal recipe. Only target parameters, instructions, source water and mixing settings are copied; observations, ratings, dates and timer session IDs are not. Legacy text-only recipes retain their text and require structured stages before scaling.
- Actual water, temperature and elapsed time are separate from targets and shown with differences. Per-stage measured water temperature is also available. Rebrewing clears observed values and tasting feedback.
- Quick actions reuse the previous brew's plan or the account's saved defaults, including bean ID, brewer, dose, water, temperature, C40 clicks, reference seconds, water source and optional kettle/mixing settings. Defaults never replace a selected recipe or an existing record. Advanced stage/mixing controls are collapsible. B75 and ORIGAMI are selectable brewers; these choices do not imply a newly verified built-in recipe.
- Bean profiles and defaults use typed auxiliary documents in the existing private `users/{uid}/brews` collection and outbox; they are excluded from brew statistics and preserved on brew/recipe saves. Existing Firestore rules are unchanged. Update every deployed frontend from the complete package: old versions do not understand the new metadata document types. Backup export version 3 includes records, custom recipes and auxiliary metadata. This release does not add backup-file import or a recycle bin.
- Decimal water/temperature validation is now consistent at 0.1g / 0.1°C.

Checks: `node test-experience.cjs` and `node test-cloud.mjs`, alongside existing scale, water mixing, advice and template checks. Browser QA covers profile creation, same-name distinct bags, linked inventory, editing without double-debit, decimal saves, timer pause/reload/completion, actual-value transfer, converting a record to recipe, modifying that recipe, persisted defaults and clean rebrew data. No production coffee records are created during tests.

## English / Traditional Chinese language switcher (2026-10-29)

The interface defaults to Traditional Chinese. A Language / 語言 selector in the main header and dialog headers switches to English immediately and remembers the choice in this browser. Switching does not reload the page, reset a form, restart the brew timer or change a saved record. The HTML language, page title, date, labels, accessibility text, placeholders, built-in reference recipes, calculators, alerts and timer display are localised. Personal bean names, custom recipe names/descriptions/instructions and free-text notes remain as entered. Reference instructions and measured values are not rewritten in storage.

Localisation is presentation-only. Existing Chinese action/valve/condition and roast-level values are deliberately retained as stable stored enums, and displayed option labels are translated separately. There is no data migration or Firebase change. The English catalogue (`dist/i18n-en.json`) contains 550 reviewed UI messages plus dynamic quantity/countdown formats. If the catalogue cannot load, the original Chinese interface remains available. Browser-native validation messages may follow the browser's own language.

New checks: `node test-i18n.cjs`. Browser QA verifies language persistence, Chinese/English switching inside an open form and timer, saving an English-interface brew with canonical step enums, and preserving personal Chinese names including text that also appears in the UI catalogue. Existing calculation, cloud-outbox, bean inventory and recipe tests remain passing.
