import type {
    TimerDurations, TimerPhase, TimerState, 
} from './types';

export const APP_TITLE = 'Pomodoro';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

export const getRemainingMs = (
    state: TimerState,
    now: number,
    durations: TimerDurations,
): number => {
    switch (state.status) {
    // 尚未開始（含一輪結束後）顯示下一輪的工作時長。
    case 'IDLE':
        return durations.workMs;
    case 'WORKING':
    case 'BREAK':
        return state.endsAt === null ? 0 : Math.max(0, state.endsAt - now);
    case 'PAUSED':
        return state.remainingMs ?? 0;
    }
};

export const getPhase = (state: TimerState): TimerPhase | null => {
    if (state.status === 'WORKING' || state.status === 'BREAK') {
        return state.status;
    }
    return state.status === 'PAUSED' ? state.pausedFrom : null;
};

export const formatRemaining = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / MS_PER_SECOND);
    const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
    const seconds = totalSeconds % SECONDS_PER_MINUTE;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// 沒有進行中的結束時間時回傳 null，由 UI 顯示「—」。
export const getNextAlertAt = (state: TimerState): number | null => state.endsAt;

export const formatClock = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 分頁標題：計時中顯示剩餘時間，暫停時加上 Paused，閒置時只顯示應用名稱。
export const formatDocumentTitle = (state: TimerState, remainingText: string): string => {
    switch (state.status) {
    case 'WORKING':
    case 'BREAK':
        return `${remainingText} · ${APP_TITLE}`;
    case 'PAUSED':
        return `Paused ${remainingText} · ${APP_TITLE}`;
    case 'IDLE':
        return APP_TITLE;
    }
};
