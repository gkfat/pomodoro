import { DEFAULT_SETTINGS } from './types';
import type { Settings } from './types';
import { parseSettings } from './validation';

export const STORAGE_KEY = 'pomodoro:settings';
const STORAGE_VERSION = 1;

export type SaveResult =
    | { ok: true }
    | { ok: false; error: string };

export const loadSettings = (storage: Storage): Settings => {
    let raw: string | null;
    try {
        raw = storage.getItem(STORAGE_KEY);
    } catch (error) {
        console.warn('[settings] 讀取 localStorage 失敗，使用預設值', error);
        return { ...DEFAULT_SETTINGS };
    }
    if (raw === null) {
        return { ...DEFAULT_SETTINGS };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        console.warn('[settings] 儲存內容不是有效 JSON，使用預設值', error);
        return { ...DEFAULT_SETTINGS };
    }

    const settings = typeof parsed === 'object' && parsed !== null && 'version' in parsed
        && parsed.version === STORAGE_VERSION && 'settings' in parsed
        ? parseSettings(parsed.settings)
        : null;
    if (settings === null) {
        console.warn('[settings] 儲存內容驗證失敗，使用預設值');
        return { ...DEFAULT_SETTINGS };
    }
    return settings;
};

export const saveSettings = (storage: Storage, settings: Settings): SaveResult => {
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify({
            version: STORAGE_VERSION, settings, 
        }));
        return { ok: true };
    } catch (error) {
        console.error('[settings] 寫入 localStorage 失敗', error);
        return {
            ok: false, error: 'Settings could not be saved and apply to this session only', 
        };
    }
};
