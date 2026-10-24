import {
    computed, readonly, ref,
} from 'vue';

// 全域唯一的「現在」：記錄最近一次更新時的 timestamp 與由它推得的本機日期。
// 元件只讀取，不自己 new Date()；需要校正時由呼叫點呼叫 refreshClock。
const timestamp = ref(Date.now());

// 本機當天 00:00 的 timestamp。只在跨日時才改變，依賴它的 computed 不會每次 tick 都重算。
const todayStart = computed(() => {
    const date = new Date(timestamp.value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
});

// 當天的 Date（00:00），僅在跨日時產生新物件。
const today = computed(() => new Date(todayStart.value));

// 以指定時間（預設為系統當下）更新中控時間，回傳採用的 timestamp。
export const refreshClock = (at: number = Date.now()): number => {
    timestamp.value = at;
    return at;
};

export const useClock = () => ({
    timestamp: readonly(timestamp),
    todayStart,
    today,
});
