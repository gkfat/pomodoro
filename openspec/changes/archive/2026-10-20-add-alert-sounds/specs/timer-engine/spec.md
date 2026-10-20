## ADDED Requirements

### Requirement: 分頁標題顯示倒數
系統 SHALL 讓瀏覽器分頁標題反映計時狀態：WORKING 或 BREAK 時顯示剩餘時間與應用名稱（例如「24:59 · Pomodoro」）；PAUSED 時加上 Paused（例如「Paused 24:00 · Pomodoro」）；IDLE 時只顯示應用名稱「Pomodoro」。標題 MUST 隨倒數更新，使用者切換到其他分頁時仍可看到剩餘時間。

#### Scenario: 倒數中
- **WHEN** 引擎為 WORKING 且剩餘 24 分 59 秒
- **THEN** 分頁標題為「24:59 · Pomodoro」，並隨倒數更新

#### Scenario: 暫停
- **WHEN** 引擎進入 PAUSED，剩餘 24 分鐘
- **THEN** 分頁標題為「Paused 24:00 · Pomodoro」

#### Scenario: 閒置
- **WHEN** 引擎為 IDLE（含 Restart 或休息結束後）
- **THEN** 分頁標題為「Pomodoro」
