# alert-sounds Specification

## Purpose

提示音目錄、靜態音檔、播放與退回 Beep、試聽與最大音量；音檔由 ElevenLabs 離線生成。

## Requirements

### Requirement: 提示音目錄
系統 SHALL 提供 8 個提示音選項：7 種由 ElevenLabs 生成、約 5 秒的短旋律（鈴聲風格：Marimba、Glass Bell、Harp；爵士／藍調：Jazz Piano、Blues Guitar、Vibraphone、Muted Trumpet）與既有的合成 Beep。預設提示音 MUST 為 Beep。提示音 id 與顯示名稱 MUST 來自單一目錄，設定、驗證與介面不得各自重複列舉。

#### Scenario: 預設值
- **WHEN** 使用者第一次開啟或沒有儲存設定
- **THEN** 提示音為 Beep

#### Scenario: 選項數量
- **WHEN** 使用者開啟提示音選項
- **THEN** 系統顯示 8 個選項，名稱與目錄一致

### Requirement: 音檔為靜態資源
7 種生成音 SHALL 以靜態音檔隨專案發佈，執行時 MUST NOT 呼叫 ElevenLabs API，瀏覽器端 MUST NOT 持有 API key。每個音檔長度 SHALL 約為 5 秒，內容 MUST 為原創旋律，不使用或模仿任何既有鈴聲。

#### Scenario: 離線可播放
- **WHEN** 使用者在沒有 ElevenLabs 帳號或網路存取該服務的情況下選擇並播放提示音
- **THEN** 系統從本站靜態資源播放，不發出任何 ElevenLabs 請求

### Requirement: 播放音量
系統播放任何提示音（含 Beep 與試聽）時 SHALL 使用應用內最大音量（增益 1，不衰減），且 MUST NOT 修改使用者的系統或喇叭音量。

#### Scenario: 以最大增益播放
- **WHEN** 系統播放 Beep 或任一音檔提示音
- **THEN** 播放增益為 1，不另外衰減

### Requirement: 播放與退回
系統 SHALL 播放使用者所選的提示音。音檔載入、解碼或播放失敗時，系統 MUST 記錄錯誤並改播 Beep；Beep 也失敗時 MUST 回報音效失敗，且不得阻斷其他提醒管道。

#### Scenario: 音檔載入失敗
- **WHEN** 所選音檔無法載入
- **THEN** 系統記錄錯誤並播放 Beep

#### Scenario: 瀏覽器擋下播放
- **WHEN** 瀏覽器不允許播放音效
- **THEN** 系統回報音效失敗並仍顯示視覺提示

### Requirement: 試聽
系統 SHALL 在設定畫面提供試聽，播放目前所選提示音一次；試聽 MUST NOT 修改已儲存的設定，且計時進行中仍可使用。試聽失敗 MUST 在畫面顯示明確錯誤。

#### Scenario: 試聽成功
- **WHEN** 使用者按下 Preview
- **THEN** 系統播放目前所選提示音一次

#### Scenario: 計時中試聽
- **WHEN** 引擎為 WORKING 且使用者按下 Preview
- **THEN** 系統播放提示音，設定與計時皆不受影響

#### Scenario: 試聽失敗
- **WHEN** 試聽時音效無法播放
- **THEN** 系統顯示錯誤訊息，不吞掉例外
