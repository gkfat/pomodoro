import {
    beforeEach, describe, expect, it, vi, 
} from 'vitest';

import {
    dispatchAlerts, playsAlertSound, 
} from './alertService';
import type { AlertChannel } from './alertService';
import {
    getNotificationSupport, showSystemNotification, 
} from './notification';

const event = {
    phase: 'WORKING', endedAt: 0, durationMs: 0, 
} as const;

describe('dispatchAlerts', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('runs every channel once', async () => {
        const run = vi.fn();
        const channels: AlertChannel[] = [
            {
                name: 'a', run, 
            }, {
                name: 'b', run, 
            },
        ];
        expect(await dispatchAlerts(event, channels)).toEqual([]);
        expect(run).toHaveBeenCalledTimes(2);
    });

    it('a failing channel does not block the others', async () => {
        const visual = vi.fn();
        const channels: AlertChannel[] = [
            {
                name: 'sound', run: () => { throw new Error('autoplay blocked'); }, 
            }, {
                name: 'visual', run: visual, 
            },
        ];
        const failures = await dispatchAlerts(event, channels);
        expect(visual).toHaveBeenCalledOnce();
        expect(failures).toEqual([
            {
                channel: 'sound', message: 'autoplay blocked', 
            },
        ]);
        expect(console.error).toHaveBeenCalled();
    });

    it('handles rejected promises', async () => {
        const channels: AlertChannel[] = [
            {
                name: 'n', run: () => Promise.reject(new Error('nope')), 
            },
        ];
        const failures = await dispatchAlerts(event, channels);
        expect(failures[0]?.message).toBe('nope');
    });
});

describe('playsAlertSound', () => {
    it('plays the sound when focus ends', () => {
        expect(playsAlertSound({
            phase: 'WORKING', endedAt: 0, durationMs: 0, 
        })).toBe(true);
    });

    it('stays silent when the break ends', () => {
        expect(playsAlertSound({
            phase: 'BREAK', endedAt: 0, durationMs: 0, 
        })).toBe(false);
    });
});

describe('system notification fallback', () => {
    it('reports unsupported when Notification is missing', () => {
        vi.stubGlobal('Notification', undefined);
        expect(getNotificationSupport()).toBe('unsupported');
        expect(() => showSystemNotification('t', 'b')).toThrow('not supported');
        vi.unstubAllGlobals();
    });

    it('throws when permission is not granted', () => {
        vi.stubGlobal('Notification', Object.assign(vi.fn(), { permission: 'denied' }));
        expect(() => showSystemNotification('t', 'b')).toThrow('not granted');
        vi.unstubAllGlobals();
    });

    it('creates a notification when granted', () => {
        const ctor = Object.assign(vi.fn(), { permission: 'granted' });
        vi.stubGlobal('Notification', ctor);
        showSystemNotification('title', 'body');
        expect(ctor).toHaveBeenCalledWith('title', { body: 'body' });
        vi.unstubAllGlobals();
    });
});
