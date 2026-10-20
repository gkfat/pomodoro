import {
    describe, expect, it, 
} from 'vitest';

import { formatBreakDuration } from './format';

describe('formatBreakDuration', () => {
    it.each([
        [30, '30 sec'],
        [60, '1 min'],
        [90, '1 min 30 sec'],
        [300, '5 min'],
        [7200, '120 min'],
    ])('formats %i seconds as %s', (seconds, expected) => {
        expect(formatBreakDuration(seconds)).toBe(expected);
    });
});
