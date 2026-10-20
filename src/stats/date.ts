const pad = (value: number): string => String(value).padStart(2, '0');

// 以本機時區的年月日為鍵（YYYY-MM-DD），新的一天以本機午夜為界。
export const toDateKey = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
