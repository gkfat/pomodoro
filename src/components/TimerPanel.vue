<script setup lang="ts">
import { computed } from 'vue';

import type { TimerState } from '@/timer/types';

const props = defineProps<{
    state: TimerState;
    remainingText: string;
    progress: number;
    isBreak: boolean;
    todayFocusText: string;
    nextAlertText: string;
}>();

const emit = defineEmits<{
    start: [];
    pause: [];
    resume: [];
    reset: [];
    startTest: [];
}>();

const isRunning = computed(() =>
    (props.state.status === 'WORKING' || props.state.status === 'BREAK') && props.state.endsAt !== null);
const isPaused = computed(() => props.state.status === 'PAUSED');

// 點擊計時圓盤即切換動作；除了進行中與暫停，其餘狀態都是「開始」。
const action = computed(() => {
    if (isPaused.value) {
        return {
            label: 'Resume', hint: 'Resume', event: 'resume', 
        } as const;
    }
    if (isRunning.value) {
        return {
            label: 'Pause', hint: 'Tap to pause', event: 'pause', 
        } as const;
    }
    return {
        label: 'Start', hint: 'Start', event: 'start', 
    } as const;
});

const onAction = (): void => {
    switch (action.value.event) {
    case 'resume':
        emit('resume');
        break;
    case 'pause':
        emit('pause');
        break;
    case 'start':
        emit('start');
        break;
    }
};

const ringColor = computed(() => (props.isBreak ? 'success' : 'primary'));

// 10 秒測試只在開發環境提供，方便驗證提醒流程。
const showTestButton = import.meta.env.DEV;
const canStartTest = computed(() => props.state.status === 'IDLE');
const canReset = computed(() => props.state.status !== 'IDLE');
</script>

<template>
    <div class="timer-panel">
        <v-btn
            class="timer-disc"
            color="surface"
            :aria-label="action.label"
            height="320"
            :ripple="false"
            rounded="circle"
            variant="flat"
            width="320"
            @click="onAction"
        >
            <v-progress-circular
                class="timer-ring"
                :color="ringColor"
                :model-value="props.progress"
                :size="296"
                :width="9"
                bg-color="surface-variant"
                rounded
            >
                <div class="d-flex flex-column align-center">
                    <!-- 下一次提醒只在進行中顯示；其餘狀態保留版面高度，避免倒數數字上下位移 -->
                    <div
                        :aria-hidden="!isRunning"
                        class="text-caption text-medium-emphasis mb-2"
                        :class="{ 'opacity-0': !isRunning }"
                    >
                        Stop at {{ props.nextAlertText }}
                    </div>
                    <div class="font-weight-black timer-digits">
                        {{ props.remainingText }}
                    </div>
                    <div class="text-subtitle-1 font-weight-bold mt-2 timer-action">
                        {{ action.hint }}
                    </div>
                </div>
            </v-progress-circular>
        </v-btn>

        <div class="text-body-1 text-medium-emphasis">
            Today {{ props.todayFocusText }}
        </div>

        <div class="d-flex align-center ga-2">
            <v-btn
                :disabled="!canReset"
                prepend-icon="mdi-restart"
                variant="text"
                @click="emit('reset')"
            >
                Restart
            </v-btn>
            <v-btn
                v-if="showTestButton"
                :disabled="!canStartTest"
                prepend-icon="mdi-flask-outline"
                variant="text"
                @click="emit('startTest')"
            >
                10-sec test
            </v-btn>
        </div>
    </div>
</template>

<style scoped>
/* Vuetify utility class 無法表達：display: contents 讓子元素直接參與父層 space-evenly 的等距分配、數字尺寸與等寬、字距、圓盤陰影、環形弧線過渡。 */
.timer-panel {
    display: contents;
}

.timer-digits {
    font-size: 4rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    /* 環的 color 會被內容繼承，這裡改回主文字色，只讓弧線帶階段色。 */
    color: rgb(var(--v-theme-on-surface));
}

.timer-action {
    letter-spacing: 0.15em;
    margin-right: -0.15em;
}

.timer-disc {
    box-shadow: 0 0 0 18px rgb(var(--v-theme-surface-variant), 0.35), 0 24px 60px rgb(0, 0, 0, 0.35);
}

.timer-ring :deep(.v-progress-circular__overlay) {
    transition: stroke-dashoffset 0.3s linear, stroke 0.4s ease;
}

@media (prefers-reduced-motion: reduce) {
    .timer-ring :deep(.v-progress-circular__overlay) {
        transition: none;
    }
}
</style>
