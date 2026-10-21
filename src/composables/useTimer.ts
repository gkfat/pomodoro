import {
    computed, onBeforeUnmount, onMounted, ref, shallowRef, watchEffect,
} from 'vue';

import {
    dispatchAlerts, playsAlertSound, 
} from '@/alerts/alertService';
import type { AlertChannel } from '@/alerts/alertService';
import {
    getNotificationSupport, requestNotificationPermission, showSystemNotification,
} from '@/alerts/notification';
import type { NotificationSupport } from '@/alerts/notification';
import { createSoundPlayer } from '@/alerts/sound';
import {
    loadSettings, saveSettings, 
} from '@/settings/storage';
import {
    addCycle, loadHistory, 
} from '@/stats/history';
import type { CyclesByDate } from '@/stats/history';
import {
    addFocusTime, loadFocusRecord, 
} from '@/stats/storage';
import type { Settings } from '@/settings/types';
import {
    APP_TITLE, formatClock, formatDocumentTitle, formatRemaining, getNextAlertAt, getPhase, getRemainingMs,
} from '@/timer/display';
import {
    createInitialState, pause, reset, resume, start, tick,
} from '@/timer/engine';
import type {
    PhaseEndedEvent, TimerDurations, TimerState, TransitionResult,
} from '@/timer/types';

const TICK_INTERVAL_MS = 250;
const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1000;
const TEST_PHASE_MS = 10_000;

const ENDED_MESSAGE = {
    WORKING: 'Focus finished. Break started.',
    BREAK: 'Break finished. Start the next round when you are ready.',
} as const;

export const useTimer = () => {
    const settings = ref<Settings>(loadSettings(localStorage));
    const state = shallowRef<TimerState>(createInitialState());
    const now = ref(Date.now());
    // 測試模式：工作與休息皆縮為 10 秒，不改動已儲存的設定。
    const isTestRun = ref(false);
    const notice = ref<string | null>(null);
    const previewError = ref<string | null>(null);
    const focusRecord = shallowRef(loadFocusRecord(localStorage, Date.now()));
    const focusHistory = shallowRef<CyclesByDate>(loadHistory(localStorage));
    const errorMessage = ref<string | null>(null);
    const notificationSupport = ref<NotificationSupport>(getNotificationSupport());

    const sound = createSoundPlayer();
    // 本輪專注按下開始的實際時間（暫停後繼續不變）；reset 或專注結束後清除。
    let workStartedAt: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const durations = computed<TimerDurations>(() => (isTestRun.value
        ? {
            workMs: TEST_PHASE_MS, breakMs: TEST_PHASE_MS, 
        }
        : {
            workMs: settings.value.workMinutes * MS_PER_MINUTE,
            breakMs: settings.value.breakSeconds * MS_PER_SECOND,
        }));

    const remainingText = computed(() =>
        formatRemaining(getRemainingMs(state.value, now.value, durations.value)));
    // 環形進度 = 目前階段剩餘比例（IDLE 為滿環，隨倒數縮短）。
    const progress = computed(() => {
        const total = getPhase(state.value) === 'BREAK' ? durations.value.breakMs : durations.value.workMs;
        const remaining = getRemainingMs(state.value, now.value, durations.value);
        return Math.min(100, Math.max(0, (remaining / total) * 100));
    });
    // PAUSED 沿用暫停前的階段；其餘非休息狀態一律視為專注。
    const isBreak = computed(() => getPhase(state.value) === 'BREAK');
    const nextAlertText = computed(() => {
        const at = getNextAlertAt(state.value);
        return at === null ? '—' : formatClock(at);
    });
    const isSettingsLocked = computed(() => state.value.status !== 'IDLE');

    const alertChannels = (event: PhaseEndedEvent): AlertChannel[] => {
        const channels: AlertChannel[] = [
            {
                name: 'Visual', run: () => { notice.value = ENDED_MESSAGE[event.phase]; }, 
            },
        ];
        if (playsAlertSound(event)) {
            channels.push({
                name: 'Sound', run: () => sound.play(settings.value.alertSound), 
            });
        }
        if (settings.value.systemNotification) {
            channels.push({
                name: 'System notification',
                run: (event) => showSystemNotification('Pomodoro', ENDED_MESSAGE[event.phase]),
            });
        }
        return channels;
    };

    const handleEvents = async (events: PhaseEndedEvent[]): Promise<void> => {
        for (const event of events) {
            const failures = await dispatchAlerts(event, alertChannels(event));
            const reasons = failures.map((failure) => `${failure.channel}: ${failure.message}`);
            if (reasons.length > 0) {
                errorMessage.value = `Some alerts failed; falling back to the in-page alert. ${reasons.join('; ')}`;
            }
        }
    };

    // 完整完成的專注：10-sec test 只計入圖表的輪數，不計入今日總時間。
    const recordFocus = (events: PhaseEndedEvent[]): void => {
        for (const event of events) {
            if (event.phase !== 'WORKING') {
                continue;
            }
            if (!isTestRun.value) {
                const result = addFocusTime(localStorage, focusRecord.value, event.endedAt, event.durationMs);
                focusRecord.value = result.record;
                if (result.error !== null) {
                    errorMessage.value = result.error;
                }
            }
            const cycle = addCycle(localStorage, focusHistory.value, {
                // 沒有記錄到開始時間（理論上不會發生）時，以時長回推。
                startedAt: workStartedAt ?? event.endedAt - event.durationMs,
                endedAt: event.endedAt,
                durationMs: event.durationMs,
            });
            focusHistory.value = cycle.history;
            if (cycle.error !== null) {
                errorMessage.value = cycle.error;
            }
            workStartedAt = null;
        }
    };

    const runTick = (): void => {
        now.value = Date.now();
        const result = tick(state.value, now.value, durations.value);
        state.value = result.state;
        // 一輪結束後回到設定的時長，測試用的 10 秒不再沿用。
        if (result.events.some((event) => event.phase === 'BREAK')) {
            isTestRun.value = false;
        }
        if (result.events.length > 0) {
            recordFocus(result.events);
            void handleEvents(result.events);
        }
    };

    const apply = (transition: (at: number) => TransitionResult): void => {
        now.value = Date.now();
        const result = transition(now.value);
        if (!result.ok) {
            errorMessage.value = result.error;
            return;
        }
        errorMessage.value = null;
        notice.value = null;
        state.value = result.state;
    };

    // 從 IDLE 開始新一輪專注時，記下實際開始時間。
    const startWork = (): void => {
        const fromIdle = state.value.status === 'IDLE';
        apply((at) => start(state.value, at, durations.value));
        if (fromIdle && state.value.status === 'WORKING') {
            workStartedAt = now.value;
        }
    };

    const onStart = (): void => {
        sound.unlock();
        sound.preload(settings.value.alertSound);
        // 新一輪開始時回到正常時長。
        if (state.value.status === 'IDLE') {
            isTestRun.value = false;
        }
        startWork();
    };
    const onStartTest = (): void => {
        if (state.value.status !== 'IDLE') {
            return;
        }
        isTestRun.value = true;
        sound.unlock();
        sound.preload(settings.value.alertSound);
        startWork();
    };
    const onPause = (): void => apply((at) => pause(state.value, at));
    const onResume = (): void => apply((at) => resume(state.value, at));
    const onReset = (): void => {
        isTestRun.value = false;
        workStartedAt = null;
        apply(() => reset());
    };

    const updateSettings = (next: Settings): void => {
        if (isSettingsLocked.value) {
            errorMessage.value = 'Settings cannot be changed while the timer is running';
            return;
        }
        if (next.alertSound !== settings.value.alertSound) {
            sound.preload(next.alertSound);
        }
        settings.value = next;
        const result = saveSettings(localStorage, next);
        errorMessage.value = result.ok ? null : result.error;
    };

    // 試聽不改變設定，計時進行中也可使用；失敗時把錯誤交給設定畫面顯示。
    const previewSound = async (): Promise<void> => {
        previewError.value = null;
        try {
            await sound.play(settings.value.alertSound);
        } catch (error) {
            console.error('[alerts] 試聽失敗', error);
            previewError.value = error instanceof Error ? error.message : String(error);
        }
    };

    const enableSystemNotification = async (enabled: boolean): Promise<void> => {
        if (!enabled) {
            updateSettings({
                ...settings.value, systemNotification: false, 
            });
            return;
        }
        notificationSupport.value = await requestNotificationPermission();
        if (notificationSupport.value !== 'granted') {
            errorMessage.value = notificationSupport.value === 'unsupported'
                ? 'This browser does not support system notifications; using in-page alerts'
                : 'Notification permission was not granted; using in-page alerts';
            updateSettings({
                ...settings.value, systemNotification: false, 
            });
            return;
        }
        updateSettings({
            ...settings.value, systemNotification: true, 
        });
    };

    const onVisibilityChange = (): void => {
        if (document.visibilityState === 'visible') {
            runTick();
        }
    };

    // 分頁標題跟著倒數，切到其他分頁也看得到剩餘時間。
    watchEffect(() => {
        document.title = formatDocumentTitle(state.value, remainingText.value);
    });

    onMounted(() => {
        intervalId = setInterval(runTick, TICK_INTERVAL_MS);
        document.addEventListener('visibilitychange', onVisibilityChange);
    });

    onBeforeUnmount(() => {
        document.title = APP_TITLE;
        if (intervalId !== null) {
            clearInterval(intervalId);
        }
        document.removeEventListener('visibilitychange', onVisibilityChange);
    });

    return {
        settings,
        state,
        notice,
        errorMessage,
        notificationSupport,
        previewError,
        remainingText,
        progress,
        isBreak,
        nextAlertText,
        focusHistory,
        isSettingsLocked,
        start: onStart,
        startTest: onStartTest,
        pause: onPause,
        resume: onResume,
        reset: onReset,
        updateSettings,
        previewSound,
        enableSystemNotification,
    };
};
