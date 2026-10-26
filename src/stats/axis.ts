const MS_PER_HOUR = 60 * 60 * 1000;

// 縱軸起點：最早一筆專注開始時間的前一小時（取整點）；沒有紀錄時從 00:00 開始。
// 參數是各筆專注「開始時間距當日 00:00 的毫秒數」。
export const getAxisStartHour = (startOffsetsMs: readonly number[]): number => {
    if (startOffsetsMs.length === 0) {
        return 0;
    }
    return Math.max(0, Math.floor(Math.min(...startOffsetsMs) / MS_PER_HOUR) - 1);
};
