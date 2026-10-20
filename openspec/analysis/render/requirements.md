# 工作蕃茄鐘 — Requirements（P0）

來源：Notion「工作蕃茄鐘」｜change：`pomodoro-p0-mvp`

## Functional

| ID | 標題 | 描述 | Priority | Context |
|---|---|---|---|---|
| FR-001 | 自訂工作時間 | 以拖曳條設定工作分鐘數（5 分鐘單位，5–120） | P0 | CTX-ACTOR-001, CTX-ASM-002 |
| FR-002 | 自訂休息時間 | 以拖曳條設定休息時間（30 秒單位，30 秒–120 分鐘） | P0 | CTX-ACTOR-001, CTX-ASM-002 |
| FR-003 | 計時控制 | 開始／暫停／繼續／Restart | P0 | CTX-ACTOR-001, CTX-CON-002 |
| FR-004 | 階段結束提醒 | 工作與休息結束各提醒一次（視覺 + 音效） | P0 | CTX-ACTOR-001, CTX-EXT-002, CTX-ASM-004 |
| FR-005 | 瀏覽器系統通知 | 授權時發系統通知，否則退回頁內提醒 | P0 | CTX-EXT-003, CTX-ASM-004 |
| FR-006 | 階段切換 | 工作結束自動進入休息；休息結束停止，等使用者按開始，不自動循環 | P0 | CTX-ACTOR-001 |
| FR-007 | 設定持久化 | localStorage 儲存／還原並驗證 | P0 | CTX-EXT-001, CTX-ASM-005 |
| FR-009 | 計時狀態機 | IDLE/WORKING/BREAK/PAUSED，WORKING→BREAK→IDLE，非法轉換拒絕 | P0 | CTX-CON-004, CTX-ACTOR-001 |
| FR-008 | 狀態顯示 | 剩餘時間（尚未開始顯示設定工作時長）、階段（底色區分）、狀態、進行中的下一次提醒時間 | P0 | CTX-ACTOR-001, CTX-ASM-003 |

## Non-Functional

| ID | 類別 | 描述 | Metric | Context |
|---|---|---|---|---|
| NFR-001 | accuracy | 以結束時間戳計時，背景／睡眠後 1 秒內修正 | 背景 30 分鐘誤差 ≤ 1s | CTX-CON-002 |
| NFR-002 | reliability | 到期於背景時回前景立即提醒，且僅一次 | 每階段提醒 = 1 | CTX-CON-002, CTX-ACTOR-001 |
| NFR-003 | security | localStorage 資料 runtime 驗證 | 無效資料 100% 退回預設值 | CTX-EXT-001 |
| NFR-004 | maintainability | 沿用現有技術棧，狀態轉換集中於單一引擎、UI 不改倒數時間 | 引擎測試覆蓋 FR-003/009、NFR-001/002 | CTX-CON-001, CTX-CON-004 |
| NFR-005 | usability | 工作 5 分鐘單位（5–120）、休息 30 秒單位（30 秒–120 分鐘），拖曳條限制取值 | 工作為 5 的倍數分鐘；休息為 30 的倍數秒 | CTX-ACTOR-001, CTX-ASM-002 |

## 待確認
無。
