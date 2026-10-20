import {
    describe, expect, it, 
} from 'vitest';

import {
    formatClock, formatRemaining, getNextAlertAt, getPhase, getRemainingMs, 
} from './display';
import {
    createInitialState, pause, reset, resume, start, tick, 
} from './engine';
import type {
    TimerDurations, TimerState, TransitionResult, 
} from './types';

const MIN = 60_000;
const durations: TimerDurations = {
    workMs: 25 * MIN, breakMs: 5 * MIN, 
};

const unwrap = (result: TransitionResult): TimerState => {
    if (!result.ok) {
        throw new Error(result.error);
    }
    return result.state;
};

describe('engine transitions', () => {
    it('IDLE start → WORKING with endsAt', () => {
        const state = unwrap(start(createInitialState(), 1000, durations));
        expect(state.status).toBe('WORKING');
        expect(state.endsAt).toBe(1000 + durations.workMs);
    });

    it('rejects start while WORKING', () => {
        const working = unwrap(start(createInitialState(), 0, durations));
        const result = start(working, 10, durations);
        expect(result.ok).toBe(false);
    });

    it('rejects pause in IDLE', () => {
        expect(pause(createInitialState(), 0).ok).toBe(false);
    });

    it('rejects resume unless PAUSED', () => {
        expect(resume(createInitialState(), 0).ok).toBe(false);
    });

    it('pause keeps remaining time and resume restores the phase', () => {
        const working = unwrap(start(createInitialState(), 0, durations));
        const paused = unwrap(pause(working, 15 * MIN));
        expect(paused.status).toBe('PAUSED');
        expect(paused.remainingMs).toBe(10 * MIN);
        const resumed = unwrap(resume(paused, 45 * MIN));
        expect(resumed.status).toBe('WORKING');
        expect(getRemainingMs(resumed, 45 * MIN, durations)).toBe(10 * MIN);
    });

    it('reset returns to IDLE', () => {
        expect(unwrap(reset()).status).toBe('IDLE');
    });
});

describe('engine tick', () => {
    it('does nothing before endsAt', () => {
        const working = unwrap(start(createInitialState(), 0, durations));
        const result = tick(working, durations.workMs - 1, durations);
        expect(result.events).toEqual([]);
        expect(result.state).toBe(working);
    });

    it('WORKING expiry → BREAK starts automatically, one event', () => {
        const working = unwrap(start(createInitialState(), 0, durations));
        const result = tick(working, durations.workMs, durations);
        expect(result.events).toEqual([
            {
                phase: 'WORKING', endedAt: durations.workMs, 
            },
        ]);
        expect(result.state.status).toBe('BREAK');
        expect(result.state.endsAt).toBe(durations.workMs + durations.breakMs);
    });

    it('break starts from the tick time after a long gap', () => {
        const working = unwrap(start(createInitialState(), 0, durations));
        const wake = 10 * 60 * MIN;
        const result = tick(working, wake, durations);
        expect(result.state.endsAt).toBe(wake + durations.breakMs);
    });

    it('emits only once even after a long gap', () => {
        const working = unwrap(start(createInitialState(), 0, durations));
        const first = tick(working, 10 * 60 * MIN, durations);
        const second = tick(first.state, 10 * 60 * MIN + 1000, durations);
        expect(first.events).toHaveLength(1);
        expect(second.events).toHaveLength(0);
    });

    it('BREAK expiry → back to IDLE and waits for the user', () => {
        const breaking = tick(unwrap(start(createInitialState(), 0, durations)), durations.workMs, durations).state;
        const breakEnd = breaking.endsAt ?? 0;
        const done = tick(breaking, breakEnd, durations);
        expect(done.events[0]?.phase).toBe('BREAK');
        expect(done.state).toEqual(createInitialState());
        expect(tick(done.state, breakEnd + 99 * MIN, durations).events).toEqual([]);
    });

    it('rejects start while BREAK is running', () => {
        const breaking = tick(unwrap(start(createInitialState(), 0, durations)), durations.workMs, durations).state;
        expect(start(breaking, durations.workMs + 1, durations).ok).toBe(false);
    });

    it('start after a finished round → WORKING', () => {
        const breaking = tick(unwrap(start(createInitialState(), 0, durations)), durations.workMs, durations).state;
        const idle = tick(breaking, breaking.endsAt ?? 0, durations).state;
        expect(unwrap(start(idle, 0, durations)).status).toBe('WORKING');
    });

    it('reset prevents the old expiry from firing', () => {
        const working = unwrap(start(createInitialState(), 0, durations));
        const idle = unwrap(reset());
        expect(tick(idle, working.endsAt ?? 0, durations).events).toEqual([]);
    });

    it('paused state never expires', () => {
        const working = unwrap(start(createInitialState(), 0, durations));
        const paused = unwrap(pause(working, MIN));
        expect(tick(paused, 999 * MIN, durations).events).toEqual([]);
    });
});

describe('display helpers', () => {
    it('formats mm:ss rounding up partial seconds', () => {
        expect(formatRemaining(25 * MIN)).toBe('25:00');
        expect(formatRemaining(1)).toBe('00:01');
        expect(formatRemaining(0)).toBe('00:00');
    });

    it('next alert is null without an end time', () => {
        expect(getNextAlertAt(createInitialState())).toBeNull();
        const working = unwrap(start(createInitialState(), 0, durations));
        expect(getNextAlertAt(working)).toBe(durations.workMs);
    });

    it('shows the work duration again once a round is finished', () => {
        const breaking = tick(unwrap(start(createInitialState(), 0, durations)), durations.workMs, durations).state;
        const idle = tick(breaking, breaking.endsAt ?? 0, durations).state;
        expect(getRemainingMs(idle, 0, durations)).toBe(durations.workMs);
    });

    it('phase is BREAK after work expires', () => {
        const breaking = tick(unwrap(start(createInitialState(), 0, durations)), durations.workMs, durations).state;
        expect(getPhase(breaking)).toBe('BREAK');
        expect(getRemainingMs(breaking, durations.workMs, durations)).toBe(durations.breakMs);
    });

    it('phase of PAUSED is the paused-from phase', () => {
        const working = unwrap(start(createInitialState(), 0, durations));
        expect(getPhase(unwrap(pause(working, MIN)))).toBe('WORKING');
        expect(getPhase(createInitialState())).toBeNull();
    });

    it('formats clock as HH:mm', () => {
        const date = new Date(2026, 0, 1, 9, 5);
        expect(formatClock(date.getTime())).toBe('09:05');
    });
});
