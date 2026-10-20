import {
    beforeEach, describe, expect, it, vi, 
} from 'vitest';

import {
    loadSettings, saveSettings, STORAGE_KEY, 
} from './storage';
import { DEFAULT_SETTINGS } from './types';
import type { Settings } from './types';
import {
    parseSettings, validateMinutes, 
} from './validation';

const custom: Settings = {
    workMinutes: 45, breakMinutes: 10, systemNotification: true, 
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

describe('parseSettings', () => {
    it('accepts valid settings', () => {
        expect(parseSettings(custom)).toEqual(custom);
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
            workMinutes: 25, breakMinutes: 5, systemNotification: 'yes', 
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
