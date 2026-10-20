## Context

- 專案為純前端 SPA（Vue 3 + TypeScript + Vuetify 4 + Vite），目前僅有空殼 `App.vue`，無既有計時邏輯。
- 瀏覽器會節流背景分頁的 timer，且裝置睡眠時 timer 停擺，不能以 tick 累加計時（NFR-001）。
- Notion 建議的狀態為 IDLE / WORKING / BREAK / PAUSED / COMPLETED（本設計移除 COMPLETED，見決策 3），且所有轉換集中於單一引擎，UI 不得自行改動倒數時間。
- 分析來源：`openspec/analysis/`（FR-001~009、NFR-001~005）。

## Goals / Non-Goals

**Goals:**
- 單一計時引擎，狀態轉換可獨立單元測試（不依賴 DOM／瀏覽器 API）。
- 背景分頁、睡眠後計時與提醒仍正確，且每階段只提醒一次。
- 設定可持久化，讀取時 runtime 驗證。

**Non-Goals:**
- 自動循環、Snooze、設定檔、勿擾、統計、同步、帳號（P1/P2）。
- 還原重新整理前進行中的計時。

## Decisions

1. **引擎為純邏輯模組，副作用由外層注入**
   - 引擎提供 `start / pause / resume / reset / tick(now, durations)`，時間以參數 `now` 傳入，不直接呼叫 `Date.now()`；狀態與轉換為純函式，便於測試。
   - 外層（composable）負責 `setInterval` 驅動 `tick`、監聽 `visibilitychange` 並在回前景時立即 `tick`。
   - 替代方案：在元件內用 `setInterval` 累加 → 背景節流會漂移，拒絕。

2. **以 `endsAt` 時間戳計算剩餘時間**
   - 進入 WORKING／BREAK 時記錄 `endsAt = now + duration`；剩餘時間 = `endsAt - now`。PAUSED 時保存 `remainingMs`，繼續時重算 `endsAt`。
   - 到期判斷只在 `tick` 內發生，並透過狀態轉換一次性產出「階段結束」事件，保證每階段只提醒一次（NFR-002）。

3. **WORKING 到期自動進入 BREAK，BREAK 到期回到 IDLE；不設 COMPLETED（2026-10-20 修訂）**
   - 狀態為 IDLE / WORKING / BREAK / PAUSED：`tick` 偵測 WORKING 到期時，產生 `phaseEnded` 事件並直接轉為 BREAK，`endsAt = tick 當下 + 休息時長`（`tick` 因此需要接收時長設定）。BREAK 到期回到 IDLE 並停止；IDLE 按開始進入 WORKING。
   - 休息從到期處理當下起算，而非從原結束時間起算：背景或睡眠後回到前景時，使用者仍能完整休息。
   - 因為 BREAK 不再有「待開始」狀態，`endsAt = null` 只出現在 IDLE、PAUSED；這些狀態不顯示下一次提醒。
   - 移除 COMPLETED 的理由：它與 IDLE 在畫面與可執行操作上沒有差別（都顯示工作時長、都從開始進入 WORKING），卻造成設定與測試按鈕在一輪結束後被鎖住。「一輪結束」的資訊由 `phaseEnded`（phase 為 BREAK）事件承載；未來若要統計休息完成率，應記錄事件，而非依賴狀態。與 Notion 建議狀態的偏離僅此一處。

4. **提醒以事件方式與引擎解耦**
   - 引擎轉換回傳 `phaseEnded` 事件；提醒服務訂閱並依序執行：頁內提示 → 音效 → 系統通知（已授權時）。任一失敗各自記錄並不阻斷其餘（音效可能被 autoplay 政策擋下）。
   - 系統通知權限只在使用者於設定啟用時才請求，不在載入時主動詢問。

5. **設定存 localStorage，讀取時手寫 type guard 驗證**
   - 儲存結構含版本欄位；讀取時 `JSON.parse` 結果視為 `unknown`，以 type guard 檢查型別、5 的倍數、5–120 範圍；失敗時記錄警告並用預設值 25／5。
   - 替代方案：Zod（全域規範偏好）→ 專案尚未安裝，需你同意後才新增，見 Open Questions。

6. **UI 僅用 Vuetify 元件與 utility class**，不寫原生 CSS（遵循專案 CLAUDE.md）；元件只呼叫引擎並讀取其狀態。僅在 Vuetify 做不到時才寫 `<style>`：等寬數字、字距、圓盤陰影、環弧過渡、`display: contents`（讓子元素參與等距分配）。
   - 主畫面：`v-progress-circular` 環形倒數（起點在正上方）；圓盤本身是操作按鈕，進行中顯示「Stop at」於數字上方（其他狀態保留高度以免數字位移）與「Tap to pause」於下方。
   - 專注／休息不使用 tab，只以頁面底色（`background` / `background-break`）與環色區分；`useTimer` 提供 `isBreak`，PAUSED 沿用暫停前階段。
   - 設定：`v-dialog` 滿版、由下方滑入（`dialog-bottom-transition`）；工作／休息以 `v-slider` 拖曳，數值以文字顯示於標題列右側；關閉鈕在下方中央。
   - 配色：莫蘭迪低飽和色系，專注為灰玫瑰、休息為鼠尾草綠，預設深色主題。
   - 開發輔助：「10 秒測試」按鈕只在 `import.meta.env.DEV` 顯示，工作與休息皆縮為 10 秒、不改動已儲存設定；休息結束回到 IDLE 或 Restart 後回到設定時長。
   - 介面文字一律使用英文（Start / Pause / Resume / Restart / Stop at / 10-sec test / Focus time / Break time / System notifications）；「重設」改名為 Restart，行為不變（回到 IDLE 並取消待觸發提醒）。

7. **目錄結構（暫定）**：`src/timer/`（引擎與型別）、`src/settings/`（設定儲存與驗證）、`src/alerts/`（提醒服務）、`src/components/`（畫面）。

## Risks / Trade-offs

- [瀏覽器 autoplay 政策阻擋音效] → 首次使用者互動（按開始）時解鎖／預載音訊；失敗時退回視覺提示並記錄。
- [背景分頁 tick 被節流，提醒延遲] → 回前景時以 `visibilitychange` 立即 `tick`；背景期間系統通知仍由到期的低頻 tick 觸發，無法保證準時，列為已知限制。
- [睡眠後回來時間差很大] → 剩餘時間以時間戳計算，到期即轉換並補提醒一次。
- [使用者調整系統時間] → 時間戳計時會受影響；P0 不處理，列為已知限制。
- [重新整理即遺失計時] → 已確認的取捨（僅還原設定）。

## Open Questions

- runtime 驗證是否同意新增 Zod 依賴？（預設：不新增，用手寫 type guard。）
- 音效素材來源：使用內建短音檔或 Web Audio 合成？（預設：Web Audio 合成，不新增資產檔。）
