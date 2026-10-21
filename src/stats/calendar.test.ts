import {
    describe, expect, it, 
} from 'vitest';

import { buildMonthGrid } from './calendar';

describe('buildMonthGrid', () => {
    it('pads the first week so day 1 lands on its weekday (Sun-first)', () => {
        // 2026-10-01 是週四
        const weeks = buildMonthGrid(2026, 9);
        expect(weeks[0]).toEqual([
            null,
            null,
            null,
            null,
            1,
            2,
            3,
        ]);
    });

    it('pads the last week and always yields full 7-cell weeks', () => {
        const weeks = buildMonthGrid(2026, 9);
        expect(weeks.every((week) => week.length === 7)).toBe(true);
        expect(weeks.at(-1)).toEqual([
            25,
            26,
            27,
            28,
            29,
            30,
            31,
        ]);
    });

    it('handles a month starting on Sunday with no leading padding', () => {
        // 2026-02-01 是週日，28 天剛好 4 週
        const weeks = buildMonthGrid(2026, 1);
        expect(weeks).toHaveLength(4);
        expect(weeks[0]?.[0]).toBe(1);
    });

    it('handles leap-year February', () => {
        const days = buildMonthGrid(2024, 1).flat().filter((cell) => cell !== null);
        expect(days).toHaveLength(29);
    });
});
