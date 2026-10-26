import {
    describe, expect, it,
} from 'vitest';

import { getAxisStartHour } from './axis';

const hours = (value: number): number => value * 60 * 60 * 1000;

describe('getAxisStartHour', () => {
    it('沒有紀錄時從 0 點開始', () => {
        expect(getAxisStartHour([])).toBe(0);
    });

    it('取最早開始時間的前一小時（整點）', () => {
        expect(getAxisStartHour([
            hours(15.5),
            hours(13.25),
            hours(20),
        ])).toBe(12);
    });

    it('最早在 1 點內或午夜截斷時不低於 0', () => {
        expect(getAxisStartHour([hours(0.5), hours(14)])).toBe(0);
        expect(getAxisStartHour([0])).toBe(0);
    });
});
