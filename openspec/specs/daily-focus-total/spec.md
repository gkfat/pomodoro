# daily-focus-total Specification

## Purpose

今日專注總時數：只累計完整完成的專注、跨日歸零、localStorage 持久化與驗證，以及主畫面顯示。

## Requirements

### Requirement: 累計完成的專注時長
系統 SHALL 在每段專注（WORKING）完整倒數結束時，把該段專注的設定時長累加到今日總計。每段專注 MUST 只累加一次；未完成的專注（例如中途 Restart）MUST NOT 計入。休息時間 MUST NOT 計入。

#### Scenario: 完成一段專注
- **WHEN** 工作時間為 25 分鐘的專注倒數結束
- **THEN** 今日總計增加 25 分鐘

#### Scenario: 累計多段
- **WHEN** 同一天完成兩段 25 分鐘的專注
- **THEN** 今日總計為 50 分鐘

#### Scenario: 中途 Restart
- **WHEN** 使用者在專注進行到一半時按 Restart
- **THEN** 今日總計不變

#### Scenario: 休息不計入
- **WHEN** 休息階段結束
- **THEN** 今日總計不變

#### Scenario: 背景期間到期不重複
- **WHEN** 專注在分頁背景時到期，使用者之後回到前景
- **THEN** 今日總計只增加一次該段時長

### Requirement: 開發用測試不計入
「10-sec test」的專注 MUST NOT 計入今日總計。

#### Scenario: 10 秒測試結束
- **WHEN** 使用者用 10-sec test 跑完一段專注
- **THEN** 今日總計不變

### Requirement: 跨日歸零
今日總計 SHALL 以本機時區的日期計算，新的一天開始時 MUST 自動從 0 開始，無需重新整理頁面。跨午夜的專注 SHALL 歸屬到其結束當下的日期。

#### Scenario: 隔天開啟
- **WHEN** 昨天累計過時數，使用者今天重新開啟頁面
- **THEN** 今日總計顯示 0 min

#### Scenario: 頁面開著過午夜
- **WHEN** 頁面持續開啟並跨過本機午夜
- **THEN** 今日總計即時歸零

### Requirement: 持久化與驗證
系統 SHALL 將今日總計存入 localStorage，重新整理後保留。讀取時 MUST 以 runtime 驗證檢查資料；缺漏、損毀或日期不是今天時 SHALL 視為 0，且 MUST NOT 影響計時運作。寫入失敗時 MUST 記錄錯誤並在畫面顯示明確訊息，且本次執行中的總計仍更新。

#### Scenario: 重新整理後保留
- **WHEN** 今日已累計 50 分鐘，使用者重新整理頁面
- **THEN** 今日總計仍為 50 分鐘

#### Scenario: 資料損毀
- **WHEN** localStorage 內的統計不是有效 JSON 或欄位型別錯誤
- **THEN** 系統記錄警告並視為 0，計時功能正常

#### Scenario: 寫入失敗
- **WHEN** localStorage 寫入拋出例外
- **THEN** 系統記錄錯誤並顯示訊息，畫面上的今日總計仍增加

### Requirement: 顯示今日總計
主畫面 SHALL 顯示今日總計，格式依時長而定：小於 1 分鐘顯示 `0 min`，整點顯示 `1 h`，其餘顯示 `1 h 25 min`（超過 1 小時）或 `45 min`（不足 1 小時），分鐘無條件捨去。顯示文字 MUST 為英文，且不得使用 tooltip。

#### Scenario: 尚未累計
- **WHEN** 今天還沒有完成任何專注
- **THEN** 畫面顯示 `Today 0 min`

#### Scenario: 超過一小時
- **WHEN** 今日總計為 85 分鐘
- **THEN** 畫面顯示 `Today 1 h 25 min`

#### Scenario: 整點
- **WHEN** 今日總計為 60 分鐘
- **THEN** 畫面顯示 `Today 1 h`
