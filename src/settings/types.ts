import { DEFAULT_ALERT_SOUND } from '@/alerts/soundCatalog';
import type { AlertSoundId } from '@/alerts/soundCatalog';

export type Settings = {
    workMinutes: number;
    breakSeconds: number;
    systemNotification: boolean;
    alertSound: AlertSoundId;
};

export const MINUTE_STEP = 5;
export const MIN_MINUTES = 5;
export const MAX_MINUTES = 120;

// 休息時間以秒儲存：30 秒為單位，最短 30 秒，上限與工作時間相同（120 分鐘）。
export const BREAK_SECOND_STEP = 30;
export const MIN_BREAK_SECONDS = 30;
export const MAX_BREAK_SECONDS = MAX_MINUTES * 60;

export const DEFAULT_SETTINGS: Settings = {
    workMinutes: 25,
    breakSeconds: 300,
    systemNotification: false,
    alertSound: DEFAULT_ALERT_SOUND,
};
