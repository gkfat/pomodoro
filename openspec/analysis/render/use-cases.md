# 工作蕃茄鐘 — Use Cases（P0）

change：`pomodoro-p0-mvp`｜上游：`requirements.yaml`

## Story 總覽

| Story | 描述 | Requirements | Use Cases |
|---|---|---|---|
| STORY-001 | 自訂工作與休息時間 | FR-001, FR-002 | UC-001 |
| STORY-002 | 開始／暫停／繼續／Restart | FR-003, FR-009 | UC-003, UC-004, UC-005 |
| STORY-003 | 階段結束提醒 | FR-004, FR-005 | UC-006, UC-007 |
| STORY-004 | 休息結束後由我決定何時開始下一輪 | FR-006, FR-009 | UC-006 |
| STORY-005 | 記住上次設定 | FR-007 | UC-001, UC-002 |
| STORY-006 | 查看剩餘時間／階段／下次提醒 | FR-008 | UC-003, UC-008 |

## UC-001 設定工作與休息時間
- Actor：CTX-ACTOR-001｜Stories：STORY-001, 005｜Requirements：FR-001, 002, 007
- 前置：引擎為 IDLE
- 主流程：1 拖曳工作時間 → 2 拖曳休息時間（NFR-005，即時顯示數字）→ 3 驗證（5 的倍數、5–120）→ 4 存入 localStorage
- 替代：localStorage 寫入失敗 → 記錄並告知僅本次有效
- 後置：設定已更新，下次可還原

## UC-002 載入已儲存設定
- Actor：CTX-ACTOR-001｜Stories：STORY-005｜Requirements：FR-007
- 前置：開啟／重新整理頁面
- 主流程：1 讀取 localStorage → 2 runtime 驗證（NFR-003）→ 3 初始化引擎為 IDLE
- 替代：無資料或無效 → 記錄警告、用預設 25／5；重新整理前有計時 → 不還原
- 後置：引擎 IDLE，設定有效

## UC-003 開始計時
- Actor：CTX-ACTOR-001｜Stories：STORY-002, 006｜Requirements：FR-003, 008, 009
- 前置：IDLE（含一輪結束後）
- 主流程：1 按開始 → 2 進入 WORKING，結束時間 = 現在 + 工作時長（NFR-001）→ 3 顯示剩餘時間、階段、下次提醒
- 替代：非法狀態開始 → 拒絕
- 後置：具明確結束時間

## UC-004 暫停與繼續
- Actor：CTX-ACTOR-001｜Stories：STORY-002｜Requirements：FR-003, 009
- 前置：WORKING／BREAK（暫停）；PAUSED（繼續）
- 主流程：1 按暫停 → 2 記錄剩餘時間、進入 PAUSED、取消待觸發提醒 → 3 按繼續 → 4 以剩餘時間重算結束時間、回原階段（NFR-001）
- 替代：非法狀態 → 拒絕
- 後置：剩餘時間不流失

## UC-005 Restart 計時
- Actor：CTX-ACTOR-001｜Stories：STORY-002｜Requirements：FR-003, 009
- 前置：引擎非 IDLE
- 主流程：1 按 Restart → 2 取消所有待觸發提醒、回 IDLE
- 替代：已在 IDLE → 不動作
- 後置：舊提醒不再觸發

## UC-006 階段結束提醒與階段切換
- Actor：CTX-ACTOR-001｜Stories：STORY-003, 004｜Requirements：FR-004, 005, 006, 009
- 前置：WORKING／BREAK 到期
- 主流程：1 引擎偵測到期（NFR-001）→ 2 觸發一次視覺 + 音效提醒（NFR-002）→ 3 已授權則發系統通知 → 4 WORKING 結束→自動進入 BREAK 並倒數；BREAK 結束→回到 IDLE，等待使用者按開始
- 替代：背景／睡眠到期 → 回前景立即補提醒一次（NFR-001/002）；通知未授權／被拒／不可用 → 退回頁內提醒並告知；音效失敗 → 記錄並仍顯示視覺提示
- 後置：僅提醒一次，不自動開始下一階段
- 備註：2026-10-20 修訂，工作→休息改為自動

## UC-007 授權瀏覽器系統通知
- Actor：CTX-ACTOR-001｜Stories：STORY-003｜Requirements：FR-005
- 前置：瀏覽器支援 Notification API 且權限為 default
- 主流程：1 於設定啟用 → 2 請求權限 → 3 使用者允許、記錄已啟用
- 替代：拒絕／已封鎖 → 說明並維持頁內提醒；不支援 → 停用選項並說明
- 後置：通知偏好已儲存

## UC-008 查看計時狀態
- Actor：CTX-ACTOR-001｜Stories：STORY-006｜Requirements：FR-008
- 前置：頁面已載入
- 主流程：1 顯示剩餘時間、階段、計時狀態 → 2 顯示下次提醒時鐘時間（NFR-001）
- 替代：IDLE／PAUSED → 不顯示下次提醒
- 後置：顯示內容皆由引擎狀態推導

## 覆蓋檢查
FR-001~009 全數對應至少一個 use case，無 gap。
