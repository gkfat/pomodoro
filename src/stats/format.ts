const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

// 今日總計顯示：分鐘無條件捨去，0 min／45 min／1 h／1 h 25 min。
export const formatFocusTotal = (ms: number): string => {
    const totalMinutes = Math.floor(Math.max(0, ms) / MS_PER_MINUTE);
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;
    if (hours === 0) {
        return `${minutes} min`;
    }
    return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
};

// 單輪／單日時長顯示：滿 1 分鐘沿用分鐘制，不滿 1 分鐘顯示秒（10 sec）。
export const formatDuration = (ms: number): string => {
    const safeMs = Math.max(0, ms);
    if (safeMs < MS_PER_MINUTE) {
        return `${Math.floor(safeMs / 1000)} sec`;
    }
    return formatFocusTotal(safeMs);
};

// 月曆格內的精簡時長：10s、25m、1h、1h25m。
export const formatCompactDuration = (ms: number): string => {
    const safeMs = Math.max(0, ms);
    if (safeMs < MS_PER_MINUTE) {
        return `${Math.floor(safeMs / 1000)}s`;
    }
    const totalMinutes = Math.floor(safeMs / MS_PER_MINUTE);
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;
    if (hours === 0) {
        return `${minutes}m`;
    }
    return minutes === 0 ? `${hours}h` : `${hours}h${minutes}m`;
};
