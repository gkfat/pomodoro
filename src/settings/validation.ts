import { isAlertSoundId } from '@/alerts/soundCatalog';

import {
    BREAK_SECOND_STEP,
    DEFAULT_SETTINGS,
    MAX_BREAK_SECONDS,
    MAX_MINUTES,
    MIN_BREAK_SECONDS,
    MIN_MINUTES,
    MINUTE_STEP,
} from './types';
import type { Settings } from './types';

// 回傳錯誤訊息；有效時回傳 null。
export const validateMinutes = (value: unknown): string | null => {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        return 'Enter a whole number of minutes';
    }
    if (value < MIN_MINUTES || value > MAX_MINUTES) {
        return `Time must be between ${MIN_MINUTES} and ${MAX_MINUTES} minutes`;
    }
    if (value % MINUTE_STEP !== 0) {
        return `Time must be a multiple of ${MINUTE_STEP}`;
    }
    return null;
};

// 回傳錯誤訊息；有效時回傳 null。
export const validateBreakSeconds = (value: unknown): string | null => {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        return 'Enter a whole number of seconds';
    }
    if (value < MIN_BREAK_SECONDS || value > MAX_BREAK_SECONDS) {
        return `Break must be between ${MIN_BREAK_SECONDS} seconds and ${MAX_BREAK_SECONDS / 60} minutes`;
    }
    if (value % BREAK_SECOND_STEP !== 0) {
        return `Break must be a multiple of ${BREAK_SECOND_STEP} seconds`;
    }
    return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

// 休息時間：優先採用 breakSeconds；舊版資料只有 breakMinutes 時換算成秒，不因改用秒而重置設定。
const parseBreakSeconds = (breakSeconds: unknown, legacyBreakMinutes: unknown): number | null => {
    if (breakSeconds !== undefined) {
        return typeof breakSeconds === 'number' && validateBreakSeconds(breakSeconds) === null
            ? breakSeconds
            : null;
    }
    if (typeof legacyBreakMinutes === 'number' && validateMinutes(legacyBreakMinutes) === null) {
        return legacyBreakMinutes * 60;
    }
    return null;
};

// 儲存內容不可信：以 unknown 收進來，逐欄位檢查後才組成 Settings。
export const parseSettings = (value: unknown): Settings | null => {
    if (!isRecord(value)) {
        return null;
    }
    const {
        workMinutes, breakSeconds, breakMinutes, systemNotification, alertSound, 
    } = value;
    if (typeof workMinutes !== 'number' || validateMinutes(workMinutes) !== null) {
        return null;
    }
    const parsedBreakSeconds = parseBreakSeconds(breakSeconds, breakMinutes);
    if (parsedBreakSeconds === null) {
        return null;
    }
    if (typeof systemNotification !== 'boolean') {
        return null;
    }
    // 舊版儲存資料沒有 alertSound：補預設，不因新增欄位而重置其他設定；有值但不在目錄中則視為無效。
    if (alertSound !== undefined && !isAlertSoundId(alertSound)) {
        return null;
    }
    return {
        workMinutes,
        breakSeconds: parsedBreakSeconds,
        systemNotification,
        alertSound: alertSound ?? DEFAULT_SETTINGS.alertSound,
    };
};
