# timer-settings Specification

## Purpose

工作／休息時間設定（拖曳條、5 分鐘步進、5–120）與 localStorage 持久化及讀取驗證。

## Requirements

### Requirement: 自訂工作與休息時間
系統 SHALL 允許使用者以拖曳條設定工作與休息長度，單位為 5 分鐘、範圍 5–120 分鐘；預設為工作 25、休息 5。拖曳時系統 SHALL 即時以文字顯示目前選到的分鐘數（不使用 tooltip）。計時進行中 MUST NOT 允許修改設定。

#### Scenario: 拖曳調整
- **WHEN** 使用者在 IDLE 將工作時間拖曳到 45 分鐘
- **THEN** 畫面即時顯示「45 min」，設定更新為 45 並儲存

#### Scenario: 範圍與步進限制
- **WHEN** 使用者拖曳到任何位置
- **THEN** 取值只會是 5 的倍數且介於 5–120 分鐘

#### Scenario: 計時進行中
- **WHEN** 引擎不是 IDLE
- **THEN** 拖曳條為停用狀態，設定不可修改

### Requirement: 設定持久化
系統 SHALL 將工作時間、休息時間與提醒偏好存入 localStorage，並在下次開啟時還原；重新整理頁面 MUST 只還原設定，不還原進行中的計時。

#### Scenario: 還原設定
- **WHEN** 使用者重新開啟頁面
- **THEN** 設定為上次儲存的值且引擎為 IDLE

#### Scenario: 重新整理時計時進行中
- **WHEN** 使用者在 WORKING 中重新整理頁面
- **THEN** 引擎回到 IDLE，設定保持不變

### Requirement: 讀取時驗證儲存資料
系統 MUST 在讀取 localStorage 時以 runtime 驗證檢查型別與範圍，不信任儲存內容；資料缺漏或無效時 SHALL 記錄警告並使用預設值，且不得拋出未處理例外。

#### Scenario: 資料被竄改
- **WHEN** localStorage 內的工作時間為字串 "abc"
- **THEN** 系統記錄警告並使用預設值 25／5

#### Scenario: 寫入失敗
- **WHEN** localStorage 寫入拋出例外
- **THEN** 系統記錄錯誤並告知使用者設定僅本次有效
