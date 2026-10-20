## 1. 統計模組

- [x] 1.1 `phaseEnded` 事件新增 `durationMs`（WORKING 為專注時長、BREAK 為休息時長）；更新引擎與既有測試
- [x] 1.2 建立 `src/stats/`：本機日期鍵 `toDateKey`、`formatFocusTotal`（`0 min`／`45 min`／`1 h`／`1 h 25 min`）
- [x] 1.3 實作儲存：以 type guard 驗證 `{ version, date, totalMs }`、`loadTodayTotal`、`addFocusTime`（累加前重新讀取、跨日以今天覆寫）、寫入失敗回傳明確錯誤
- [x] 1.4 單元測試：日期鍵、格式化（含 0、59 秒、60、85 分鐘）、跨日歸零、資料損毀、型別錯誤、寫入拋例外、重新讀取後累加

## 2. 整合

- [x] 2.1 `useTimer`：收到 WORKING 的 `phaseEnded` 且非 10-sec test 時累加；提供今日總計文字（隨 `now` 重新計算日期，跨午夜即時歸零）
- [x] 2.2 寫入失敗時沿用 `errorMessage` 顯示英文訊息，記憶體總計仍更新

## 3. 畫面

- [x] 3.1 主畫面圓盤下方、Restart 列之上顯示 `Today …`（Vuetify 元件與 utility class，英文文字，無 tooltip）

## 4. 驗證

- [x] 4.1 `pnpm lint`、`pnpm type-check`、`pnpm test:run`、`pnpm build` 全數通過
- [x] 4.2 手動驗證：完成一段專注後總計增加、中途 Restart 不增加、休息與 10-sec test 不增加、重新整理後保留、改系統日期後隔天歸零、損毀資料不影響計時
