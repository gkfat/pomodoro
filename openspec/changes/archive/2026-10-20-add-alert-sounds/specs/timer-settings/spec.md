## ADDED Requirements

### Requirement: 提示音設定
系統 SHALL 在設定畫面提供提示音選擇，從提示音目錄中選取一項並立即儲存；計時進行中 MUST NOT 允許更改選擇。選擇旁 SHALL 提供試聽按鈕（行為見 alert-sounds）。

#### Scenario: 選擇提示音
- **WHEN** 使用者在 IDLE 將提示音改為 Harp
- **THEN** 設定更新為 Harp 並儲存

#### Scenario: 計時進行中
- **WHEN** 引擎為 WORKING、BREAK 或 PAUSED
- **THEN** 提示音選擇為停用狀態，試聽按鈕仍可使用

## MODIFIED Requirements

### Requirement: 自訂工作與休息時間
系統 SHALL 允許使用者以拖曳條設定工作與休息長度。工作時間單位為 5 分鐘、範圍 5–120 分鐘，預設 25 分鐘；休息時間單位為 30 秒、範圍 30 秒–120 分鐘，預設 5 分鐘。拖曳時系統 SHALL 即時以文字顯示目前選到的時間（例如 30 sec、1 min、1 min 30 sec，不使用 tooltip）。計時進行中 MUST NOT 允許修改設定。

#### Scenario: 拖曳調整工作時間
- **WHEN** 使用者在 IDLE 將工作時間拖曳到 45 分鐘
- **THEN** 畫面即時顯示「45 min」，設定更新為 45 並儲存

#### Scenario: 休息時間以 30 秒為單位
- **WHEN** 使用者在 IDLE 將休息時間拖曳到最左端
- **THEN** 畫面顯示「30 sec」，休息時間設定為 30 秒；再往右一格為「1 min」，再一格為「1 min 30 sec」

#### Scenario: 範圍與步進限制
- **WHEN** 使用者拖曳到任何位置
- **THEN** 工作時間只會是 5 的倍數分鐘且介於 5–120 分鐘，休息時間只會是 30 的倍數秒且介於 30 秒–120 分鐘

#### Scenario: 計時進行中
- **WHEN** 引擎為 WORKING、BREAK 或 PAUSED
- **THEN** 拖曳條為停用狀態，設定不可修改

### Requirement: 設定持久化
系統 SHALL 將工作時間（分鐘）、休息時間（秒）、提示音與提醒偏好存入 localStorage，並在下次開啟時還原；重新整理頁面 MUST 只還原設定，不還原進行中的計時。舊版儲存資料缺少提示音欄位時，系統 MUST 以預設提示音補上，且 MUST NOT 因此重置其他已儲存的設定。

#### Scenario: 還原設定
- **WHEN** 使用者重新開啟頁面
- **THEN** 設定為上次儲存的值且引擎為 IDLE

#### Scenario: 重新整理時計時進行中
- **WHEN** 使用者在 WORKING 中重新整理頁面
- **THEN** 引擎回到 IDLE，設定保持不變

#### Scenario: 舊資料以分鐘儲存休息時間
- **WHEN** localStorage 內的設定以舊欄位 breakMinutes（分鐘）儲存休息時間且值有效
- **THEN** 系統換算成秒（例如 10 分鐘 → 600 秒），其他設定保持不變

#### Scenario: 休息時間值無效
- **WHEN** localStorage 內的休息秒數不是 30 的倍數、小於 30 或大於 7200
- **THEN** 系統記錄警告並使用預設設定

#### Scenario: 舊資料缺少提示音
- **WHEN** localStorage 內的設定有效但沒有提示音欄位
- **THEN** 工作與休息時間保持原值，提示音為預設 Beep

#### Scenario: 提示音值無效
- **WHEN** localStorage 內的提示音不是目錄中的 id
- **THEN** 系統記錄警告並使用預設設定
