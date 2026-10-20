# timer-engine Specification

## Purpose

Pomodoro 計時狀態機：開始／暫停／繼續／Restart、時間戳計時、階段自動切換與狀態顯示資料。

## Requirements

### Requirement: 計時狀態機
計時引擎 SHALL 具備 IDLE、WORKING、BREAK、PAUSED 四種狀態，所有狀態轉換 MUST 集中於引擎處理，UI 元件 MUST NOT 自行修改倒數時間。非法轉換 MUST 被拒絕且維持原狀態。

#### Scenario: 正常流程
- **WHEN** 引擎為 IDLE 且使用者開始
- **THEN** 引擎進入 WORKING 並具有明確的結束時間

#### Scenario: 非法轉換
- **WHEN** 引擎為 WORKING 時再次收到開始
- **THEN** 引擎拒絕該轉換並維持 WORKING

### Requirement: 以時間戳計時
引擎 SHALL 以結束時間戳計算剩餘時間，MUST NOT 依賴 tick 累加；分頁於背景或裝置睡眠後回到前景時，顯示 MUST 於 1 秒內修正。

#### Scenario: 背景分頁後回到前景
- **WHEN** 分頁在 WORKING 期間於背景停留 10 分鐘後回到前景
- **THEN** 剩餘時間等於結束時間減去目前時間，誤差不超過 1 秒

### Requirement: 暫停與繼續
引擎 SHALL 允許在 WORKING 或 BREAK 暫停並進入 PAUSED，保存剩餘時間；繼續 MUST 以剩餘時間重新計算結束時間並回到暫停前的階段。

#### Scenario: 暫停後繼續
- **WHEN** 使用者在剩餘 10 分鐘時暫停，30 分鐘後繼續
- **THEN** 引擎回到原階段且剩餘時間仍為 10 分鐘

#### Scenario: 非法暫停
- **WHEN** 引擎為 IDLE 時收到暫停
- **THEN** 引擎拒絕並維持原狀態

### Requirement: Restart
引擎 SHALL 允許於非 IDLE 狀態執行 Restart（UI 按鈕文字為「Restart」），回到 IDLE 並取消所有待觸發的階段結束事件。

#### Scenario: Restart 後舊提醒不觸發
- **WHEN** 使用者在 WORKING 中按 Restart，且原結束時間隨後到達
- **THEN** 系統不觸發任何階段結束事件

### Requirement: 階段切換
WORKING 到期後，引擎 SHALL 自動進入 BREAK 並立即開始倒數，結束時間從到期處理當下起算；BREAK 到期後 SHALL 回到 IDLE 並停止，等使用者按開始才進入下一輪 WORKING。引擎 MUST NOT 在 BREAK 結束後自動開始下一輪。

#### Scenario: 工作結束自動休息
- **WHEN** WORKING 到期
- **THEN** 引擎進入 BREAK 並以休息時長開始倒數

#### Scenario: 休息結束後等待
- **WHEN** BREAK 到期
- **THEN** 引擎回到 IDLE，直到使用者按開始才進入 WORKING

### Requirement: 狀態顯示資料
引擎 SHALL 提供剩餘時間（mm:ss）、目前階段、計時狀態與下一次提醒時間（時鐘時間）；IDLE 狀態（含一輪結束後）剩餘時間 MUST 顯示設定的工作時長；沒有進行中結束時間時，下一次提醒 MUST 為空值且不顯示。

#### Scenario: 進行中顯示
- **WHEN** 引擎為 WORKING 且結束時間為 14:25
- **THEN** 下一次提醒時間顯示 14:25

#### Scenario: 一輪結束後
- **WHEN** 一輪結束、引擎回到 IDLE
- **THEN** 剩餘時間顯示設定的工作時長，而不是 00:00

#### Scenario: 無結束時間
- **WHEN** 引擎為 IDLE 或 PAUSED
- **THEN** 系統不顯示下一次提醒時間

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
