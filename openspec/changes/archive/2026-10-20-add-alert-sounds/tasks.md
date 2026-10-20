## 1. 音檔生成（alert-sounds）

- [x] 1.1 撰寫 7 個提示詞（Marimba、Glass Bell、Harp、Jazz Piano、Blues Guitar、Vibraphone、Muted Trumpet）：只描述樂器、情緒、節奏、5 秒與乾淨收尾，不提及產品或曲名
- [x] 1.2 實作 `scripts/generate-sounds.mjs`：以內建 `fetch` 呼叫 ElevenLabs Sound Effects API（`duration_seconds = 5`），輸出 `public/sounds/<id>.mp3`；API key 僅從 `ELEVENLABS_API_KEY` 讀取，缺少時明確報錯
- [x] 1.3 由使用者提供 API key 後執行腳本生成 7 個音檔；逐一試聽挑選，不滿意者調整提示詞重生成
- [x] 1.4 確認 7 個檔案存在、長度約 5 秒、單檔體積合理

## 2. 提示音目錄與播放（alert-sounds）

- [x] 2.1 建立 `src/alerts/soundCatalog.ts`：`AlertSoundId`、顯示名稱、音檔路徑、預設值 `beep`
- [x] 2.2 擴充 `sound.ts` 播放器：依 id 載入並快取 `AudioBuffer`，以 `AudioBufferSourceNode` 播放；載入、解碼或播放失敗時記錄並退回 Beep
- [x] 2.3 單元測試：目錄完整性（8 個 id、名稱不重複）、Beep 與音檔皆以增益 1 播放、失敗退回 Beep、Beep 也失敗時回報錯誤

## 3. 設定（timer-settings）

- [x] 3.1 `Settings` 新增 `alertSound`，預設 `beep`；型別與驗證由目錄推導
- [x] 3.2 `parseSettings`：缺少 `alertSound` 補預設、未知 id 視為無效；既有的儲存與讀取行為不變
- [x] 3.3 單元測試：舊資料缺欄位、有效 id、未知 id、型別錯誤

## 3b. 休息時間 30 秒單位

- [x] 3b.1 `Settings.breakMinutes` 改為 `breakSeconds`（預設 300、30 秒單位、30–7200）；`validateBreakSeconds` 與 `formatBreakDuration`
- [x] 3b.2 `parseSettings` 相容舊 `breakMinutes`（換算成秒）、無效值退回預設；單元測試
- [x] 3b.3 設定畫面休息滑桿改為秒（最短 30 sec），標題列顯示 30 sec／1 min／1 min 30 sec；`useTimer` 以秒計算休息時長

## 4. 整合與畫面

- [x] 4.1 `useTimer`：工作結束播放所選提示音、休息結束不播放；提供 `preview()` 與 `updateSettings` 的提示音更新（計時進行中拒絕）
- [x] 4.2 設定畫面新增 Alert sound 選擇與 Preview 按鈕；計時進行中選擇停用、試聽仍可用；試聽失敗顯示錯誤（Vuetify 元件，介面文字為英文）
- [x] 4.3 選擇或試聽時預先載入所選音檔

- [x] 4.4 分頁標題顯示倒數：`formatDocumentTitle`（倒數中／Paused／閒置）、`useTimer` 以 `watchEffect` 同步 `document.title`；單元測試

## 5. 驗證

- [x] 5.1 `pnpm lint`、`pnpm type-check`、`pnpm test:run`、`pnpm build` 全數通過
- [x] 5.2 手動驗證：8 個提示音皆可選擇並試聽、工作結束播放所選音且休息結束無聲、刪除某音檔後退回 Beep、休息時間可調到 30 sec 並完整倒數 30 秒、舊設定資料（breakMinutes）升級後工作／休息時間不變、網路面板無 ElevenLabs 請求
