## Why

目前提醒音只有一個以 Web Audio 合成的三聲 beep，聽起來單調，也無法選擇。需要提供數種接近手機鈴聲質感的短音樂，並讓使用者在設定中挑選與試聽。

## What Changes

- 以 ElevenLabs Sound Effects 離線生成 7 段約 5 秒的原創短旋律：3 段鈴聲風格（Marimba、Glass Bell、Harp，質感參考手機鈴聲）與 4 段爵士／藍調（Jazz Piano、Blues Guitar、Vibraphone、Muted Trumpet）；不模仿或使用任何既有鈴聲或曲目，生成後的 mp3 隨專案發佈為靜態資源。
- 新增提示音目錄：7 種新音效 + 既有的合成 Beep，共 8 個選項；預設維持 Beep，避免改變既有使用者的行為。
- 設定畫面新增「提示音」選擇（8 選 1）與試聽按鈕；選擇會存入 localStorage，舊資料缺少該欄位時視為預設值而不是被判定無效。
- 階段結束提醒改為播放使用者所選的提示音；音檔載入或播放失敗時退回 Beep，並仍顯示視覺提示。
- 播放音量一律設為最大（Web Audio 增益 1），不修改使用者的系統或喇叭音量。
- 休息時間改以 30 秒為單位、最短 30 秒（上限仍為 120 分鐘），設定改以秒儲存；舊資料的 `breakMinutes` 自動換算成秒。工作時間維持 5 分鐘為單位。
- 瀏覽器分頁標題跟著倒數：計時中顯示剩餘時間（如 `24:59 · Pomodoro`），暫停加 Paused，閒置只顯示 Pomodoro。
- 不在範圍：音量調整、自訂上傳、震動、執行時呼叫 ElevenLabs API（瀏覽器端不持有 API key）。

## Capabilities

### New Capabilities
- `alert-sounds`: 提示音目錄（7 種生成音效 + Beep）、音檔載入與播放、試聽、失敗時退回 Beep，以及音檔生成與發佈方式。

### Modified Capabilities
- `timer-alerts`: 階段結束提醒播放的是使用者所選的提示音，而非固定的 beep。
- `timer-engine`: 新增分頁標題顯示倒數。
- `timer-settings`: 休息時間改為 30 秒單位（最短 30 秒）；新增提示音選擇與試聽；持久化納入提示音欄位，並相容缺少該欄位的舊資料。

## Impact

- 程式碼：`src/alerts/`（提示音目錄與播放器）、`src/settings/`（型別、驗證、儲存）、`src/components/SettingsPanel.vue`、`src/composables/useTimer.ts`。
- 資源：`public/sounds/*.mp3`（7 檔，各約 5 秒）。
- 工具：新增一支一次性的生成腳本（Node 內建 `fetch`，不新增套件），執行時需要環境變數 `ELEVENLABS_API_KEY`；key 不進入專案或瀏覽器。
- 外部服務：ElevenLabs Sound Effects API，只在生成音檔時使用，會消耗該帳號的額度。
