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
