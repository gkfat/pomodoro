// 以週日為首的月曆格：每週 7 格，月初之前與月底之後補 null。
export const buildMonthGrid = (year: number, month: number): (number | null)[][] => {
    const leading = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [...Array.from({ length: leading }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }
    return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
};
