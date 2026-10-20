## Why

目前使用者無法得知今天一共專注了多久。Notion 規劃的 P2「每日工作統計」中，最基本的一項是把當日完成的蕃茄鐘工時加總並顯示，讓使用者有明確的成就回饋。

## What Changes

- 新增「今日工作時數」統計：每當一段專注（WORKING）完整倒數結束，就把該段的設定時長累加到今日總計；中途 Restart 的未完成專注不計入。
- 主畫面顯示今日總計（例如 `Today 1 h 25 min`），在新的一天（本機時區午夜）自動歸零。
- 總計存入 localStorage，重新整理後保留，讀取時做 runtime 驗證，無效資料視為 0。
- 開發用的「10-sec test」不計入統計。
- 不在範圍：歷史紀錄與多日圖表、休息時間統計、連續久坐時間、匯出、依實際經過時間累計、跨裝置同步。

## Capabilities

### New Capabilities
- `daily-focus-total`: 今日專注總時數的累計規則、跨日歸零、持久化與驗證，以及主畫面顯示。

### Modified Capabilities

（無；既有 spec 的需求不變。引擎的 `phaseEnded` 事件新增階段時長欄位屬實作細節。）

## Impact

- 程式碼：`src/timer/`（`phaseEnded` 事件帶階段時長）、新增 `src/stats/`（日期鍵、儲存與驗證、格式化）、`src/composables/useTimer.ts`、`src/components/TimerPanel.vue`（或 `App.vue`）顯示。
- 儲存：新增 localStorage key `pomodoro:daily-focus`。
- 依賴：不新增套件。
