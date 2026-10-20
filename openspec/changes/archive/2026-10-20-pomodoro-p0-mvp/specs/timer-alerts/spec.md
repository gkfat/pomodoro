## ADDED Requirements

### Requirement: 階段結束提醒
系統 SHALL 在工作階段與休息階段結束時各觸發一次提醒，包含頁內視覺提示與音效；任一提醒管道失敗 MUST 記錄錯誤且不阻斷其他管道。

#### Scenario: 工作結束
- **WHEN** WORKING 到期
- **THEN** 系統顯示頁內視覺提示並播放音效，各一次

#### Scenario: 音效被瀏覽器擋下
- **WHEN** 音效播放失敗
- **THEN** 系統記錄錯誤並仍顯示視覺提示

### Requirement: 瀏覽器系統通知
系統 SHALL 在使用者於設定啟用且已授權時，於階段結束發出系統通知；權限請求 MUST 僅在使用者主動啟用時發出。未授權、被拒絕或 API 不可用時，系統 MUST 退回頁內提醒並告知原因。

#### Scenario: 已授權
- **WHEN** 通知權限為 granted 且階段結束
- **THEN** 系統發出系統通知與頁內提醒

#### Scenario: 使用者拒絕授權
- **WHEN** 使用者在權限提示中拒絕
- **THEN** 系統顯示說明並維持頁內提醒

#### Scenario: 瀏覽器不支援
- **WHEN** 瀏覽器不支援 Notification API
- **THEN** 系統停用該選項並說明原因

### Requirement: 提醒不遺漏且不重複
每個階段結束 SHALL 只提醒一次。階段於背景或睡眠期間到期時，系統 MUST 於使用者回到前景時立即補觸發提醒，且不得重複。

#### Scenario: 背景期間到期
- **WHEN** WORKING 在分頁背景時到期，使用者之後回到前景
- **THEN** 系統立即觸發一次提醒

#### Scenario: Restart 後不觸發舊提醒
- **WHEN** 使用者按 Restart
- **THEN** 先前排定的提醒不會觸發
