import {
    describe, expect, it,
} from 'vitest';
import {
    effectScope, watch, 
} from 'vue';

import {
    refreshClock, useClock,
} from './clock';

describe('clock', () => {
    it('refreshClock 更新 timestamp 並回傳採用的值', () => {
        const at = new Date(2026, 9, 23, 15, 30).getTime();
        expect(refreshClock(at)).toBe(at);
        expect(useClock().timestamp.value).toBe(at);
    });

    it('today 為當天本機 00:00', () => {
        refreshClock(new Date(2026, 9, 23, 23, 59).getTime());
        const { today } = useClock();
        expect(today.value.getTime()).toBe(new Date(2026, 9, 23).getTime());
    });

    it('同一天內更新不觸發 today 變更，跨日才觸發', () => {
        refreshClock(new Date(2026, 9, 23, 10).getTime());
        const { today } = useClock();
        const seen: number[] = [];
        const scope = effectScope();
        scope.run(() => {
            watch(today, (value) => seen.push(value.getDate()), { flush: 'sync' });
        });
        refreshClock(new Date(2026, 9, 23, 22).getTime());
        expect(seen).toEqual([]);
        refreshClock(new Date(2026, 9, 24, 0, 1).getTime());
        expect(seen).toEqual([24]);
        scope.stop();
    });
});
