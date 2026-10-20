## MODIFIED Requirements

### Requirement: 階段結束提醒
系統 SHALL 在工作階段與休息階段結束時各觸發一次提醒。工作結束的提醒包含頁內視覺提示與使用者所選的提示音；休息結束只提供頁內視覺提示，MUST NOT 播放提示音。任一提醒管道失敗 MUST 記錄錯誤且不阻斷其他管道。

#### Scenario: 工作結束
- **WHEN** WORKING 到期
- **THEN** 系統顯示頁內視覺提示並播放所選提示音，各一次

#### Scenario: 休息結束
- **WHEN** BREAK 到期
- **THEN** 系統只顯示頁內視覺提示（已授權時另發系統通知），不播放任何提示音

#### Scenario: 音效被瀏覽器擋下
- **WHEN** 音效播放失敗
- **THEN** 系統記錄錯誤並仍顯示視覺提示

#### Scenario: 所選音檔無法載入
- **WHEN** 所選提示音的音檔載入失敗
- **THEN** 系統改播 Beep，視覺提示與系統通知照常
