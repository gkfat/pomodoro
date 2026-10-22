import { createInitialState } from './engine';
import type {
    TimerPhase, TimerState,
} from './types';

export const TIMER_STORAGE_KEY = 'pomodoro:timer-session';
const STORAGE_VERSION = 1;

// 進行中的計時工作階段：重新整理後據此還原，而不是回到 IDLE。
export type TimerSession = {
    state: TimerState;
    isTestRun: boolean;
    // 本輪專注按下開始的實際時間；休息中為 null。
    workStartedAt: number | null;
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isPhase = (value: unknown): value is TimerPhase => value === 'WORKING' || value === 'BREAK';

// 儲存內容不可信：逐欄位檢查，且 status 與其他欄位必須互相一致。
const parseState = (value: unknown): TimerState | null => {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const {
        status, endsAt, remainingMs, pausedFrom,
    } = value as Record<string, unknown>;
    if (isPhase(status) && isFiniteNumber(endsAt) && remainingMs === null && pausedFrom === null) {
        return {
            status, endsAt, remainingMs: null, pausedFrom: null,
        };
    }
    if (status === 'PAUSED' && endsAt === null && isFiniteNumber(remainingMs) && remainingMs >= 0 && isPhase(pausedFrom)) {
        return {
            status, endsAt: null, remainingMs, pausedFrom,
        };
    }
    return null;
};

const parseSession = (value: unknown): TimerSession | null => {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const {
        version, state, isTestRun, workStartedAt,
    } = value as Record<string, unknown>;
    if (version !== STORAGE_VERSION || typeof isTestRun !== 'boolean') {
        return null;
    }
    if (workStartedAt !== null && !isFiniteNumber(workStartedAt)) {
        return null;
    }
    const parsedState = parseState(state);
    if (parsedState === null) {
        return null;
    }
    return {
        state: parsedState, isTestRun, workStartedAt,
    };
};

export const idleSession = (): TimerSession => ({
    state: createInitialState(), isTestRun: false, workStartedAt: null,
});

// 缺漏、損毀或驗證失敗一律視為沒有進行中的計時，不影響應用程式啟動。
export const loadTimerSession = (storage: Storage): TimerSession => {
    let raw: string | null;
    try {
        raw = storage.getItem(TIMER_STORAGE_KEY);
    } catch (error) {
        console.warn('[timer] 讀取計時狀態失敗，從 IDLE 開始', error);
        return idleSession();
    }
    if (raw === null) {
        return idleSession();
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        console.warn('[timer] 計時狀態不是有效 JSON，從 IDLE 開始', error);
        return idleSession();
    }

    const session = parseSession(parsed);
    if (session === null) {
        console.warn('[timer] 計時狀態驗證失敗，從 IDLE 開始');
        return idleSession();
    }
    return session;
};

// IDLE 不需保留，直接移除 key。寫入失敗只記錄：計時照常運作，僅重新整理後無法還原。
export const saveTimerSession = (storage: Storage, session: TimerSession): void => {
    try {
        if (session.state.status === 'IDLE') {
            storage.removeItem(TIMER_STORAGE_KEY);
            return;
        }
        storage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
            version: STORAGE_VERSION, ...session,
        }));
    } catch (error) {
        console.error('[timer] 寫入計時狀態失敗，重新整理後將無法還原', error);
    }
};
