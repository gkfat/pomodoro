import { toDateKey } from './date';

export const HISTORY_STORAGE_KEY = 'pomodoro:focus-history';
const STORAGE_VERSION = 3;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 一輪完整專注：起訖為實際時間（含暫停），durationMs 為專注時長（不含暫停）。
export type FocusSession = {
    startedAt: number;
    endedAt: number;
    durationMs: number;
};

// 日期鍵（YYYY-MM-DD，以結束時間所在日為準）→ 當天的專注，依完成順序排列。
export type CyclesByDate = Readonly<Record<string, readonly FocusSession[]>>;

export const sumDurationMs = (sessions: readonly FocusSession[]): number =>
    sessions.reduce((sum, session) => sum + session.durationMs, 0);

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const parseSession = (value: unknown): FocusSession | null => {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const {
        startedAt, endedAt, durationMs,
    } = value as Record<string, unknown>;
    if (!isFiniteNumber(startedAt) || !isFiniteNumber(endedAt) || !isFiniteNumber(durationMs)) {
        return null;
    }
    if (startedAt < 0 || endedAt < startedAt || durationMs <= 0) {
        return null;
    }
    return {
        startedAt, endedAt, durationMs,
    };
};

export type AddCycleResult = {
    history: CyclesByDate;
    // 寫入失敗時的訊息；記憶體中的紀錄仍已更新。
    error: string | null;
};

// 儲存內容不可信：逐筆檢查，無效的項目直接捨棄，不影響其他日期。
const parseHistory = (value: unknown): CyclesByDate | null => {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const {
        version, days, 
    } = value as Record<string, unknown>;
    if (version !== STORAGE_VERSION || typeof days !== 'object' || days === null) {
        return null;
    }
    const result: Record<string, FocusSession[]> = {};
    for (const [date, cycles] of Object.entries(days)) {
        if (!DATE_KEY_PATTERN.test(date) || !Array.isArray(cycles)) {
            continue;
        }
        const valid = cycles.map(parseSession).filter((session): session is FocusSession => session !== null);
        if (valid.length > 0) {
            result[date] = valid;
        }
    }
    return result;
};

export const loadHistory = (storage: Storage): CyclesByDate => {
    let raw: string | null;
    try {
        raw = storage.getItem(HISTORY_STORAGE_KEY);
    } catch (error) {
        console.warn('[stats] 讀取專注歷史失敗，視為空', error);
        return {};
    }
    if (raw === null) {
        return {};
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        console.warn('[stats] 專注歷史不是有效 JSON，視為空', error);
        return {};
    }

    const history = parseHistory(parsed);
    if (history === null) {
        console.warn('[stats] 專注歷史驗證失敗，視為空');
        return {};
    }
    return history;
};

// 為結束時間所在日加一輪。與 addFocusTime 同樣先重讀儲存值（避免覆寫其他分頁），
// 並逐日取輪數較多者（紀錄只會追加，較長者即較新；避免先前寫入失敗時遺失記憶體中的輪數）。
export const addCycle = (storage: Storage, current: CyclesByDate, session: FocusSession): AddCycleResult => {
    const merged: Record<string, readonly FocusSession[]> = { ...loadHistory(storage) };
    for (const [date, cycles] of Object.entries(current)) {
        if (cycles.length > (merged[date]?.length ?? 0)) {
            merged[date] = cycles;
        }
    }
    const dateKey = toDateKey(session.endedAt);
    merged[dateKey] = [...(merged[dateKey] ?? []), session];
    try {
        storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({
            version: STORAGE_VERSION, days: merged, 
        }));
        return {
            history: merged, error: null, 
        };
    } catch (error) {
        console.error('[stats] 寫入專注歷史失敗', error);
        return {
            history: merged, error: 'Focus history could not be saved and will be lost on reload', 
        };
    }
};
