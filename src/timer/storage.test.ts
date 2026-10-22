import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';

import {
    TIMER_STORAGE_KEY, idleSession, loadTimerSession, saveTimerSession,
} from './storage';
import type { TimerSession } from './storage';

const working: TimerSession = {
    state: {
        status: 'WORKING', endsAt: 2_000, remainingMs: null, pausedFrom: null,
    },
    isTestRun: false,
    workStartedAt: 1_000,
};

const paused: TimerSession = {
    state: {
        status: 'PAUSED', endsAt: null, remainingMs: 500, pausedFrom: 'BREAK',
    },
    isTestRun: true,
    workStartedAt: null,
};

describe('timer session storage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('returns idle when nothing is stored', () => {
        expect(loadTimerSession(localStorage)).toEqual(idleSession());
    });

    it.each([working, paused])('round-trips %#', (session) => {
        saveTimerSession(localStorage, session);
        expect(loadTimerSession(localStorage)).toEqual(session);
    });

    it('removes the key when idle', () => {
        saveTimerSession(localStorage, working);
        saveTimerSession(localStorage, idleSession());
        expect(localStorage.getItem(TIMER_STORAGE_KEY)).toBeNull();
    });

    it.each([
        ['invalid JSON', '{oops'],
        [
            'wrong version', JSON.stringify({
                version: 9, ...working,
            }),
        ],
        [
            'unknown status', JSON.stringify({
                version: 1, ...working, state: {
                    ...working.state, status: 'FOO',
                },
            }),
        ],
        [
            'running without endsAt', JSON.stringify({
                version: 1, ...working, state: {
                    ...working.state, endsAt: null,
                },
            }),
        ],
        [
            'paused with negative remaining', JSON.stringify({
                version: 1, ...paused, state: {
                    ...paused.state, remainingMs: -1,
                },
            }),
        ],
        [
            'non-numeric workStartedAt', JSON.stringify({
                version: 1, ...working, workStartedAt: 'x',
            }),
        ],
    ])('falls back to idle on %s', (_name, raw) => {
        localStorage.setItem(TIMER_STORAGE_KEY, raw);
        expect(loadTimerSession(localStorage)).toEqual(idleSession());
    });

    it('does not throw when writing fails', () => {
        const failing = { setItem: () => { throw new Error('quota'); } } as unknown as Storage;
        expect(() => saveTimerSession(failing, working)).not.toThrow();
        expect(console.error).toHaveBeenCalled();
    });
});
