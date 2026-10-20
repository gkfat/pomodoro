## Context

- 目前 `src/alerts/sound.ts` 以 Web Audio 合成 3 聲 beep，`createSoundPlayer()` 提供 `unlock()` 與 `play()`；`useTimer` 在階段結束時透過 `alertChannels` 呼叫 `sound.play()`。
- 專案是純前端 SPA，沒有後端；全域規範禁止把 API key 放進程式碼，且新增套件前需先徵求同意。
- 設定存在 localStorage（`pomodoro:settings`，版本 1），讀取時以手寫 type guard 驗證，欄位缺漏即整份退回預設。
- 需求：7 種約 5 秒的新提示音（3 種參考手機鈴聲質感、4 種爵士／藍調），由 ElevenLabs 生成；可在設定中選擇並試聽。

## Goals / Non-Goals

**Goals:**
- 7 段原創短旋律以靜態資源提供，執行時不依賴任何外部服務。
- 設定中可選擇提示音並試聽；階段結束播放所選音。
- 載入或播放失敗時有明確退路，且不影響視覺提示與系統通知。

**Non-Goals:**
- 瀏覽器端即時呼叫 ElevenLabs API、使用者上傳音檔、音量與震動調整。
- 複製或取樣任何既有鈴聲；音樂只取「質感」參考。

## Decisions

1. **離線生成、成品入庫，不在執行時呼叫 ElevenLabs**
   - 一支 Node 腳本（`scripts/generate-sounds.mjs`）以內建 `fetch` 呼叫 Sound Effects API，`duration_seconds = 5`，輸出 `public/sounds/<id>.mp3`；API key 只從環境變數 `ELEVENLABS_API_KEY` 讀取。
   - 替代方案：瀏覽器端即時生成 → 需要把 key 放進前端、每次播放都耗額度與延遲，拒絕。
   - 替代方案：使用官方 `@elevenlabs/*` SDK → 為一次性腳本新增依賴不值得；以 REST 呼叫即可。

2. **提示音目錄為單一資料來源**
   - `src/alerts/soundCatalog.ts` 定義 `AlertSoundId`（`beep | marimba | glass-bell | harp | jazz-piano | blues-guitar | vibraphone | muted-trumpet`）、顯示名稱與音檔路徑；設定型別、驗證與 UI 都由它推導，避免多處重複列舉。
   - `beep` 沿用既有合成音，無音檔，預設值維持 `beep`。

3. **播放沿用已解鎖的 AudioContext**
   - 音檔以 `fetch` + `decodeAudioData` 解碼成 `AudioBuffer`，以 `AudioBufferSourceNode` 播放，並依 id 快取；與既有 `unlock()`（使用者按開始時 resume）共用同一個 context，不另外處理 autoplay。
   - 替代方案：`HTMLAudioElement` → 需要另一套 autoplay 處理，且和既有解鎖機制不一致。
   - 選中某個音後預先載入（試聽或儲存時），降低階段結束瞬間的延遲。

4. **退回策略**
   - 音檔載入、解碼或播放失敗時：記錄錯誤、改播 Beep；Beep 也失敗才算「音效」管道失敗，沿用既有 `dispatchAlerts` 的獨立失敗處理。
   - 試聽失敗時在設定畫面顯示明確錯誤，不吞例外。

5. **設定相容性：缺少欄位視為預設，不升版本**
   - `parseSettings` 對 `alertSound` 缺漏時補預設 `beep`，其他情況（型別錯誤、未知 id）才視為無效；避免舊使用者的工作／休息時間因新增欄位而被重置。
   - 替代方案：升 storage 版本並寫遷移 → 只新增一個選填欄位，過度設計。

6. **休息時間以秒儲存，舊資料換算**
   - `Settings.breakMinutes` 改為 `breakSeconds`（預設 300，30 秒為單位，30–7200）；工作時間仍為 `workMinutes`。
   - `parseSettings` 優先採用 `breakSeconds`；只有舊欄位 `breakMinutes` 且有效時換算成秒（×60），避免使用者既有設定被重置；兩者皆無或無效則整份退回預設。儲存一律寫新欄位，不升 storage 版本。
   - 顯示格式由 `formatBreakDuration` 負責（30 sec、1 min、1 min 30 sec）。
   - 風險：休息短到 30 秒時，工作結束提醒與休息開始幾乎連在一起；音效只在工作結束播放，休息結束僅視覺提示，兩者不會重疊。

7. **試聽與鎖定**
   - 試聽不受計時鎖定限制（不改變設定）；「選擇提示音」遵循既有規則，計時進行中停用。
   - 試聽按鈕為使用者互動，因此同時完成 AudioContext 解鎖。

8. **音量一律最大**：Beep 與音檔都經過增益為 1 的 `GainNode` 播放（Web Audio 增益上限，不放大以免失真）；網頁無法也不應修改使用者的系統或喇叭音量，因此「最大」指應用內不衰減。

9. **只有工作結束播放提示音**：`playsAlertSound(event)` 只在 `phase = WORKING` 為真；休息結束僅顯示視覺提示（與已授權的系統通知）。音效管道因此不會出現在休息結束的提醒中，也就不會產生音效失敗。

10. **UI**：僅用 Vuetify 元件（`v-select` 或 `v-radio-group` + `v-btn` 圖示）與 utility class；介面文字使用英文（Alert sound、Preview、各提示音名稱）。

## Risks / Trade-offs

- [生成結果品質不穩、不一定接近預期風格] → 每個提示詞可重生成；人工試聽挑選後才提交；可為每個音保留提示詞於腳本中以便重現。
- [ElevenLabs 生成音檔的授權與商用條款依方案而異] → 提交前確認帳號方案允許使用；音檔來源與提示詞記錄於腳本註解。
- [mp3 隨專案發佈增加體積] → 7 檔 × 約 5 秒，實測各約 81 KB（共約 570 KB），可接受。
- [提示詞若點名特定歌曲可能產生近似既有鈴聲] → 提示詞只描述樂器、情緒、節奏與長度，不提及產品名或曲名。
- [無 API key 時無法在本機重新生成] → 成品已入庫，一般開發與建置不需要 key。

## Open Questions

- ElevenLabs API key 由你在執行生成腳本時於 shell 設定（不會寫入專案）；是否要我在 apply 階段協助執行腳本，或由你自行執行？
- 7 種音色名稱是否沿用？（已移除 Music Box、Soft Pulse。）
