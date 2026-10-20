const SECONDS_PER_MINUTE = 60;

// 休息時間顯示：30 sec、1 min、1 min 30 sec。
export const formatBreakDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    const rest = seconds % SECONDS_PER_MINUTE;
    if (minutes === 0) {
        return `${rest} sec`;
    }
    return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} sec`;
};
