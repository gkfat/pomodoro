import {
    beforeEach, describe, expect, it, vi, 
} from 'vitest';

import { toDateKey } from './date';
import {
    formatCompactDuration, formatDuration, formatFocusTotal, 
} from './format';
import {
    addFocusTime, FOCUS_STORAGE_KEY, loadFocusRecord, 
} from './storage';

const MIN = 60_000;
const day = (year: number, month: number, date: number, hour = 12): number =>
    new Date(year, month - 1, date, hour).getTime();

describe('toDateKey', () => {
    it('uses the local calendar date with zero padding', () => {
        expect(toDateKey(new Date(2026, 0, 5, 9, 30).getTime())).toBe('2026-01-05');
    });

    it('changes exactly at local midnight', () => {
        expect(toDateKey(new Date(2026, 9, 20, 23, 59, 59).getTime())).toBe('2026-10-20');
        expect(toDateKey(new Date(2026, 9, 21, 0, 0, 0).getTime())).toBe('2026-10-21');
    });
});

describe('formatFocusTotal', () => {
    it.each([
        [0, '0 min'],
        [59_000, '0 min'],
        [MIN, '1 min'],
        [45 * MIN, '45 min'],
        [60 * MIN, '1 h'],
        [85 * MIN, '1 h 25 min'],
        [120 * MIN, '2 h'],
        [-5, '0 min'],
    ])('formats %i ms as %s', (ms, expected) => {
        expect(formatFocusTotal(ms)).toBe(expected);
    });
});

describe('formatDuration', () => {
    it.each([
        [0, '0 sec'],
        [10_000, '10 sec'],
        [59_999, '59 sec'],
        [MIN, '1 min'],
        [25 * MIN, '25 min'],
        [85 * MIN, '1 h 25 min'],
    ])('formats %i ms as %s', (ms, expected) => {
        expect(formatDuration(ms)).toBe(expected);
    });
});

describe('formatCompactDuration', () => {
    it.each([
        [0, '0s'],
        [10_000, '10s'],
        [59_999, '59s'],
        [MIN, '1m'],
        [25 * MIN, '25m'],
        [60 * MIN, '1h'],
        [85 * MIN, '1h25m'],
    ])('formats %i ms as %s', (ms, expected) => {
        expect(formatCompactDuration(ms)).toBe(expected);
    });
});

describe('daily focus storage', () => {
    const now = day(2026, 10, 20);
    const today = '2026-10-20';

    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('starts from zero when nothing is stored', () => {
        expect(loadFocusRecord(localStorage, now)).toEqual({
            version: 1, date: today, totalMs: 0, 
        });
    });

    it('accumulates completed focus sessions and persists them', () => {
        const first = addFocusTime(localStorage, loadFocusRecord(localStorage, now), now, 25 * MIN);
        const second = addFocusTime(localStorage, first.record, now, 25 * MIN);
        expect(second.record.totalMs).toBe(50 * MIN);
        expect(second.error).toBeNull();
        expect(loadFocusRecord(localStorage, now).totalMs).toBe(50 * MIN);
    });

    it('treats a record from another day as zero', () => {
        localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify({
            version: 1, date: '2026-10-19', totalMs: 90 * MIN, 
        }));
        expect(loadFocusRecord(localStorage, now).totalMs).toBe(0);
    });

    it('starts a new day from zero when adding after midnight', () => {
        const yesterday = day(2026, 10, 19, 23);
        const old = addFocusTime(localStorage, loadFocusRecord(localStorage, yesterday), yesterday, 25 * MIN);
        const next = addFocusTime(localStorage, old.record, now, 25 * MIN);
        expect(next.record).toEqual({
            version: 1, date: today, totalMs: 25 * MIN, 
        });
    });

    it('re-reads storage so another tab\'s total is not overwritten', () => {
        const stale = loadFocusRecord(localStorage, now);
        localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify({
            version: 1, date: today, totalMs: 50 * MIN, 
        }));
        expect(addFocusTime(localStorage, stale, now, 25 * MIN).record.totalMs).toBe(75 * MIN);
    });

    it('keeps the in-memory total when an earlier write failed', () => {
        const failing = {
            getItem: () => null,
            setItem: () => { throw new Error('quota'); },
        } as unknown as Storage;
        const first = addFocusTime(failing, loadFocusRecord(failing, now), now, 25 * MIN);
        expect(first.error).toMatch(/could not be saved/);
        const second = addFocusTime(failing, first.record, now, 25 * MIN);
        expect(second.record.totalMs).toBe(50 * MIN);
        expect(console.error).toHaveBeenCalled();
    });

    it.each([
        ['invalid JSON', '{oops'],
        [
            'wrong version', JSON.stringify({
                version: 2, date: '2026-10-20', totalMs: 5, 
            }),
        ],
        [
            'bad date', JSON.stringify({
                version: 1, date: 'today', totalMs: 5, 
            }),
        ],
        [
            'string total', JSON.stringify({
                version: 1, date: '2026-10-20', totalMs: '5', 
            }),
        ],
        [
            'negative total', JSON.stringify({
                version: 1, date: '2026-10-20', totalMs: -5, 
            }),
        ],
        ['null', 'null'],
    ])('treats %s as zero without throwing', (_name, raw) => {
        localStorage.setItem(FOCUS_STORAGE_KEY, raw);
        expect(loadFocusRecord(localStorage, now).totalMs).toBe(0);
    });

    it('treats a throwing getItem as zero', () => {
        const storage = { getItem: () => { throw new Error('denied'); } } as unknown as Storage;
        expect(loadFocusRecord(storage, now).totalMs).toBe(0);
        expect(console.warn).toHaveBeenCalled();
    });
});
