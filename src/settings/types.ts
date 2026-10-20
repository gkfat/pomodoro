export type Settings = {
    workMinutes: number;
    breakMinutes: number;
    systemNotification: boolean;
};

export const MINUTE_STEP = 5;
export const MIN_MINUTES = 5;
export const MAX_MINUTES = 120;

export const DEFAULT_SETTINGS: Settings = {
    workMinutes: 25,
    breakMinutes: 5,
    systemNotification: false,
};
