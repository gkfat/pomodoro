import type {
    TickResult,
    TimerDurations,
    TimerPhase,
    TimerState,
    TransitionResult,
} from './types';

export const createInitialState = (): TimerState => ({
    status: 'IDLE',
    endsAt: null,
    remainingMs: null,
    pausedFrom: null,
});

const fail = (action: string, state: TimerState): TransitionResult => ({
    ok: false,
    error: `Cannot ${action} while ${state.status}`,
});

const running = (phase: TimerPhase, endsAt: number): TimerState => ({
    status: phase,
    endsAt,
    remainingMs: null,
    pausedFrom: null,
});

const isRunning = (state: TimerState): boolean =>
    (state.status === 'WORKING' || state.status === 'BREAK') && state.endsAt !== null;

export const start = (
    state: TimerState,
    now: number,
    durations: TimerDurations,
): TransitionResult => {
    if (state.status === 'IDLE') {
        return {
            ok: true, state: running('WORKING', now + durations.workMs), 
        };
    }
    return fail('start', state);
};

export const pause = (state: TimerState, now: number): TransitionResult => {
    if (!isRunning(state) || state.endsAt === null) {
        return fail('pause', state);
    }
    return {
        ok: true,
        state: {
            status: 'PAUSED',
            endsAt: null,
            remainingMs: Math.max(0, state.endsAt - now),
            pausedFrom: state.status as TimerPhase,
        },
    };
};

export const resume = (state: TimerState, now: number): TransitionResult => {
    if (state.status !== 'PAUSED' || state.pausedFrom === null || state.remainingMs === null) {
        return fail('resume', state);
    }
    return {
        ok: true, state: running(state.pausedFrom, now + state.remainingMs), 
    };
};

export const reset = (): TransitionResult => ({
    ok: true, state: createInitialState(), 
});

// 到期判斷只發生在這裡；每次到期只產生一個事件，因此每階段只提醒一次。
// WORKING 到期後自動進入 BREAK（從 tick 當下起算）；BREAK 到期回到 IDLE，等待使用者開始下一輪。
export const tick = (state: TimerState, now: number, durations: TimerDurations): TickResult => {
    if (!isRunning(state) || state.endsAt === null || now < state.endsAt) {
        return {
            state, events: [], 
        };
    }
    const event = {
        phase: state.status as TimerPhase, endedAt: now, 
    };
    const next: TimerState = state.status === 'WORKING'
        ? running('BREAK', now + durations.breakMs)
        : createInitialState();
    return {
        state: next, events: [event], 
    };
};
