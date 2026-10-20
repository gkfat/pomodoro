export type TimerStatus = 'IDLE' | 'WORKING' | 'BREAK' | 'PAUSED';

export type TimerPhase = 'WORKING' | 'BREAK';

// endsAt 為 null 代表目前沒有倒數：IDLE、PAUSED。
export type TimerState = {
    status: TimerStatus;
    endsAt: number | null;
    remainingMs: number | null;
    pausedFrom: TimerPhase | null;
};

export type TimerDurations = {
    workMs: number;
    breakMs: number;
};

export type PhaseEndedEvent = {
    phase: TimerPhase;
    endedAt: number;
    // 剛結束那一段的時長（毫秒）：WORKING 為專注時長、BREAK 為休息時長。
    durationMs: number;
};

export type TransitionResult =
    | { ok: true; state: TimerState }
    | { ok: false; error: string };

export type TickResult = {
    state: TimerState;
    events: PhaseEndedEvent[];
};
