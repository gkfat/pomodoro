import {
    beforeEach, describe, expect, it, vi, 
} from 'vitest';

import {
    loadSettings, saveSettings, STORAGE_KEY, 
} from './storage';
import { DEFAULT_SETTINGS } from './types';
import type { Settings } from './types';
import {
    parseSettings, validateBreakSeconds, validateMinutes, 
} from './validation';

const custom: Settings = {
    workMinutes: 45, breakSeconds: 600, systemNotification: true, alertSound: 'harp', 
};

describe('validateMinutes', () => {
    it.each([
        5,
        25,
        120,
    ])('accepts %i', (value) => {
        expect(validateMinutes(value)).toBeNull();
    });

    it.each([
        0,
        4,
        7,
        125,
        130,
        2.5,
        '25',
        null,
        Number.NaN,
    ])('rejects %s', (value) => {
        expect(validateMinutes(value)).not.toBeNull();
    });
});

describe('validateBreakSeconds', () => {
    it.each([
        30,
        60,
        90,
        300,
        7200,
    ])('accepts %i', (value) => {
        expect(validateBreakSeconds(value)).toBeNull();
    });

    it.each([
        0,
        29,
        45,
        100,
        7230,
        7201,
        30.5,
        '30',
        null,
        Number.NaN,
    ])('rejects %s', (value) => {
        expect(validateBreakSeconds(value)).not.toBeNull();
    });
});

describe('parseSettings', () => {
    it('accepts valid settings', () => {
        expect(parseSettings(custom)).toEqual(custom);
    });

    it('fills the default alert sound for data without the field', () => {
        const legacy = {
            workMinutes: 45, breakSeconds: 600, systemNotification: true, 
        };
        expect(parseSettings(legacy)).toEqual({
            ...legacy, alertSound: 'beep', 
        });
    });

    it('converts legacy breakMinutes to seconds', () => {
        expect(parseSettings({
            workMinutes: 45, breakMinutes: 10, systemNotification: true, 
        })).toEqual({
            workMinutes: 45, breakSeconds: 600, systemNotification: true, alertSound: 'beep', 
        });
    });

    it('prefers breakSeconds over legacy breakMinutes', () => {
        expect(parseSettings({
            workMinutes: 25, breakSeconds: 30, breakMinutes: 10, systemNotification: false, 
        })?.breakSeconds).toBe(30);
    });
    it.each([
        null,
        'abc',
        [],
        {
            workMinutes: 'abc', breakMinutes: 5, systemNotification: false, 
        },
        {
            workMinutes: 25, breakMinutes: 7, systemNotification: false, 
        },
        {
            workMinutes: 25, breakMinutes: 5, 
        },
        {
            workMinutes: 25, breakSeconds: 45, systemNotification: false, 
        },
        {
            workMinutes: 25, breakSeconds: 'abc', systemNotification: false, 
        },
        {
            workMinutes: 25, systemNotification: false, 
        },
        {
            workMinutes: 25, breakMinutes: 5, systemNotification: 'yes', 
        },
        {
            workMinutes: 25, breakMinutes: 5, systemNotification: false, alertSound: 'ringtone', 
        },
        {
            workMinutes: 25, breakMinutes: 5, systemNotification: false, alertSound: 3, 
        },
    ])('rejects %j', (value) => {
        expect(parseSettings(value)).toBeNull();
    });
});

describe('storage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('returns defaults when nothing stored', () => {
        expect(loadSettings(localStorage)).toEqual(DEFAULT_SETTINGS);
    });

    it('round-trips saved settings', () => {
        expect(saveSettings(localStorage, custom).ok).toBe(true);
        expect(loadSettings(localStorage)).toEqual(custom);
    });

    it('keeps stored times when upgrading legacy data (breakMinutes, no alertSound)', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: 1,
            settings: {
                workMinutes: 45, breakMinutes: 10, systemNotification: true, 
            },
        }));
        expect(loadSettings(localStorage)).toEqual({
            workMinutes: 45, breakSeconds: 600, systemNotification: true, alertSound: 'beep', 
        });
    });

    it('falls back to defaults on invalid JSON', () => {
        localStorage.setItem(STORAGE_KEY, '{oops');
        expect(loadSettings(localStorage)).toEqual(DEFAULT_SETTINGS);
        expect(console.warn).toHaveBeenCalled();
    });

    it('falls back to defaults on tampered values', () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                version: 1, settings: {
                    workMinutes: 'abc', breakMinutes: 5, systemNotification: false, 
                }, 
            }),
        );
        expect(loadSettings(localStorage)).toEqual(DEFAULT_SETTINGS);
    });

    it('falls back to defaults on unknown version', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: 99, settings: custom, 
        }));
        expect(loadSettings(localStorage)).toEqual(DEFAULT_SETTINGS);
    });

    it('returns defaults when getItem throws', () => {
        const storage = { getItem: () => { throw new Error('denied'); } } as unknown as Storage;
        expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    });

    it('reports save failure without throwing', () => {
        const storage = { setItem: () => { throw new Error('quota'); } } as unknown as Storage;
        const result = saveSettings(storage, custom);
        expect(result.ok).toBe(false);
        expect(console.error).toHaveBeenCalled();
    });
});
