import {
    MAX_MINUTES, MIN_MINUTES, MINUTE_STEP, 
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

// 儲存內容不可信：以 unknown 收進來，逐欄位檢查後才組成 Settings。
export const parseSettings = (value: unknown): Settings | null => {
    if (!isRecord(value)) {
        return null;
    }
    const {
        workMinutes, breakMinutes, systemNotification, 
    } = value;
    if (validateMinutes(workMinutes) !== null || validateMinutes(breakMinutes) !== null) {
        return null;
    }
    if (typeof workMinutes !== 'number' || typeof breakMinutes !== 'number') {
        return null;
    }
    if (typeof systemNotification !== 'boolean') {
        return null;
    }
    return {
        workMinutes, breakMinutes, systemNotification, 
    };
};
