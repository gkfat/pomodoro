import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';

import type { FocusSession } from './history';
import {
    addCycle, HISTORY_STORAGE_KEY, loadHistory, sumDurationMs,
} from './history';

const MIN = 60_000;
const at = (year: number, month: number, date: number, hour = 12, minute = 0): number =>
    new Date(year, month - 1, date, hour, minute).getTime();

// 以開始時間與時長建立一輪專注（無暫停：結束 = 開始 + 時長）。
const session = (startedAt: number, durationMs: number): FocusSession => ({
    startedAt, endedAt: startedAt + durationMs, durationMs,
});

describe('focus history storage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('is empty when nothing is stored', () => {
        expect(loadHistory(localStorage)).toEqual({});
    });

    it('groups sessions by the local day they ended and persists them', () => {
        const a = session(at(2026, 10, 20, 9), 25 * MIN);
        const b = session(at(2026, 10, 20, 15), 10_000);
        const c = session(at(2026, 10, 21, 9), 25 * MIN);
        const first = addCycle(localStorage, {}, a);
        const second = addCycle(localStorage, first.history, b);
        const third = addCycle(localStorage, second.history, c);
        expect(third.history).toEqual({
            '2026-10-20': [a, b], '2026-10-21': [c],
        });
        expect(third.error).toBeNull();
        expect(loadHistory(localStorage)).toEqual(third.history);
    });

    it('assigns a session crossing midnight to the day it ended', () => {
        const late = session(at(2026, 10, 20, 23, 50), 25 * MIN);
        expect(Object.keys(addCycle(localStorage, {}, late).history)).toEqual(['2026-10-21']);
    });

    it('re-reads storage so another tab\'s sessions are not overwritten', () => {
        const stored = session(at(2026, 10, 20, 9), 25 * MIN);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({
            version: 3, days: { '2026-10-20': [stored] },
        }));
        const added = session(at(2026, 10, 20, 10), 25 * MIN);
        expect(addCycle(localStorage, {}, added).history).toEqual({ '2026-10-20': [stored, added] });
    });

    it('keeps in-memory sessions when an earlier write failed', () => {
        const failing = {
            getItem: () => null,
            setItem: () => { throw new Error('quota'); },
        } as unknown as Storage;
        const a = session(at(2026, 10, 20, 9), MIN);
        const b = session(at(2026, 10, 20, 10), MIN);
        const first = addCycle(failing, {}, a);
        expect(first.error).toMatch(/could not be saved/);
        expect(addCycle(failing, first.history, b).history).toEqual({ '2026-10-20': [a, b] });
        expect(console.error).toHaveBeenCalled();
    });

    it('drops invalid entries but keeps valid ones', () => {
        const valid = session(at(2026, 10, 20, 9), 5 * MIN);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({
            version: 3,
            days: {
                '2026-10-20': [
                    valid,
                    {
                        startedAt: 10, endedAt: 5, durationMs: 5, 
                    },
                    {
                        startedAt: 1, endedAt: 2, durationMs: 0, 
                    },
                    {
                        startedAt: '1', endedAt: 2, durationMs: 1, 
                    },
                    7,
                    null,
                ],
                today: [valid],
                '2026-10-19': [],
                '2026-10-18': 3,
            },
        }));
        expect(loadHistory(localStorage)).toEqual({ '2026-10-20': [valid] });
    });

    it.each([
        ['invalid JSON', '{oops'],
        [
            'previous version (no start times)', JSON.stringify({
                version: 2, days: { '2026-10-20': [60_000] }, 
            }),
        ],
        ['missing days', JSON.stringify({ version: 3 })],
        ['null', 'null'],
    ])('treats %s as empty without throwing', (_name, raw) => {
        localStorage.setItem(HISTORY_STORAGE_KEY, raw);
        expect(loadHistory(localStorage)).toEqual({});
    });

    it('treats a throwing getItem as empty', () => {
        const storage = { getItem: () => { throw new Error('denied'); } } as unknown as Storage;
        expect(loadHistory(storage)).toEqual({});
        expect(console.warn).toHaveBeenCalled();
    });
});

describe('sumDurationMs', () => {
    it('sums focused time, not wall-clock span', () => {
        const paused: FocusSession = {
            startedAt: 0, endedAt: 40 * MIN, durationMs: 25 * MIN,
        };
        expect(sumDurationMs([paused, session(0, 10_000)])).toBe(25 * MIN + 10_000);
        expect(sumDurationMs([])).toBe(0);
    });
});
