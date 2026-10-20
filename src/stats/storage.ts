import { toDateKey } from './date';

export const FOCUS_STORAGE_KEY = 'pomodoro:daily-focus';
const STORAGE_VERSION = 1;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DailyFocusRecord = {
    version: typeof STORAGE_VERSION;
    date: string;
    totalMs: number;
};

export type AddFocusResult = {
    record: DailyFocusRecord;
    // 寫入失敗時的訊息；記憶體中的總計仍已更新。
    error: string | null;
};

const emptyRecord = (now: number): DailyFocusRecord => ({
    version: STORAGE_VERSION, date: toDateKey(now), totalMs: 0, 
});

// 儲存內容不可信：以 unknown 收進來，逐欄位檢查後才組成 record。
const parseRecord = (value: unknown): DailyFocusRecord | null => {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const {
        version, date, totalMs, 
    } = value as Record<string, unknown>;
    if (version !== STORAGE_VERSION) {
        return null;
    }
    if (typeof date !== 'string' || !DATE_KEY_PATTERN.test(date)) {
        return null;
    }
    if (typeof totalMs !== 'number' || !Number.isFinite(totalMs) || totalMs < 0) {
        return null;
    }
    return {
        version: STORAGE_VERSION, date, totalMs, 
    };
};

// 讀取今天的紀錄；缺漏、損毀或日期不是今天時視為 0，且不影響計時。
export const loadFocusRecord = (storage: Storage, now: number): DailyFocusRecord => {
    let raw: string | null;
    try {
        raw = storage.getItem(FOCUS_STORAGE_KEY);
    } catch (error) {
        console.warn('[stats] 讀取 localStorage 失敗，今日總計視為 0', error);
        return emptyRecord(now);
    }
    if (raw === null) {
        return emptyRecord(now);
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        console.warn('[stats] 儲存內容不是有效 JSON，今日總計視為 0', error);
        return emptyRecord(now);
    }

    const record = parseRecord(parsed);
    if (record === null) {
        console.warn('[stats] 儲存內容驗證失敗，今日總計視為 0');
        return emptyRecord(now);
    }
    return record.date === toDateKey(now) ? record : emptyRecord(now);
};

// 累加一段完成的專注。累加前重新讀取儲存值（避免覆寫其他分頁的結果），
// 並與記憶體中已知的總計取較大者（避免先前寫入失敗時遺失已累計的時數）。
export const addFocusTime = (
    storage: Storage,
    current: DailyFocusRecord,
    now: number,
    durationMs: number,
): AddFocusResult => {
    const today = toDateKey(now);
    const known = current.date === today ? current.totalMs : 0;
    const base = Math.max(loadFocusRecord(storage, now).totalMs, known);
    const record: DailyFocusRecord = {
        version: STORAGE_VERSION, date: today, totalMs: base + Math.max(0, durationMs), 
    };
    try {
        storage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(record));
        return {
            record, error: null, 
        };
    } catch (error) {
        console.error('[stats] 寫入 localStorage 失敗', error);
        return {
            record, error: 'Today\'s total could not be saved and will reset on reload', 
        };
    }
};
