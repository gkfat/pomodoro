<script setup lang="ts">
import {
    computed, ref, 
} from 'vue';

import { useClock } from '@/clock/clock';
import { toDateKey } from '@/stats/date';
import { formatCompactDuration } from '@/stats/format';
import { sumDurationMs } from '@/stats/history';
import type { CyclesByDate } from '@/stats/history';
import { formatClock } from '@/timer/display';

const props = defineProps<{
    cyclesByDate: CyclesByDate;
}>();

const VISIBLE_DAYS = 5;
const PLOT_MIN_HEIGHT = 240;
const FOOTER_HEIGHT = 44;
// 專注很短（如 10-sec test）時，方塊仍至少有這個高度才看得見。
const MIN_BLOCK_HEIGHT = 3;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// 縱軸每小時一條分隔線；標籤每 3 小時標一次，避免擠在一起。
const LABEL_EVERY_HOURS = 3;

const { today } = useClock();
// 視窗最後一天往前推幾天；0 代表最後一天是今日（不可再往後）。
const daysBack = ref(0);

const percent = (ms: number): number => (Math.min(MS_PER_DAY, Math.max(0, ms)) / MS_PER_DAY) * 100;

const days = computed(() => Array.from({ length: VISIBLE_DAYS }, (_, index) => {
    const date = new Date(
        today.value.getFullYear(), today.value.getMonth(), today.value.getDate() - daysBack.value - (VISIBLE_DAYS - 1 - index),
    );
    const dayStart = date.getTime();
    const sessions = props.cyclesByDate[toDateKey(dayStart)] ?? [];
    return {
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        totalMs: sumDurationMs(sessions),
        // 跨午夜的專注只畫當天的部分：起訖裁切在 00:00～24:00 之內。
        blocks: sessions.map((session) => {
            const top = percent(session.startedAt - dayStart);
            return {
                top,
                height: percent(session.endedAt - dayStart) - top,
                tooltip: `${formatClock(session.startedAt)} – ${formatClock(session.endedAt)}`,
            };
        }),
    };
}));

const rangeText = computed(() => `${days.value[0]?.label} – ${days.value.at(-1)?.label}`);

const shiftWindow = (delta: number): void => {
    daysBack.value = Math.max(0, daysBack.value + delta);
};
</script>

<template>
    <div
        class="d-flex flex-column flex-grow-1 w-100"
    >
        <div class="d-flex align-center justify-space-between mb-2">
            <v-btn
                aria-label="Earlier days"
                density="comfortable"
                icon="mdi-chevron-left"
                variant="text"
                @click="shiftWindow(VISIBLE_DAYS)"
            />
            <div class="text-subtitle-2 text-medium-emphasis">
                Focus cycles · {{ rangeText }}
            </div>
            <v-btn
                aria-label="Later days"
                density="comfortable"
                :disabled="daysBack === 0"
                icon="mdi-chevron-right"
                variant="text"
                @click="shiftWindow(-VISIBLE_DAYS)"
            />
        </div>
        <v-row
            class="ga-1 flex-nowrap flex-grow-1"
            no-gutters
        >
            <!-- 時間軸：00:00 在最上方、24:00 在最下方 -->
            <v-col
                class="d-flex flex-column flex-grow-0"
                cols="1"
            >
                <div
                    class="position-relative flex-grow-1"
                    :style="{ minHeight: `${PLOT_MIN_HEIGHT}px` }"
                >
                    <div
                        v-for="hour in HOURS.filter((value) => value % LABEL_EVERY_HOURS === 0)"
                        :key="hour"
                        class="position-absolute text-caption text-medium-emphasis"
                        :style="{ top: `${(hour / 24) * 100}%` }"
                    >
                        {{ String(hour).padStart(2, '0') }}
                    </div>
                </div>
                <div :style="{ height: `${FOOTER_HEIGHT}px` }" />
            </v-col>

            <v-col
                v-for="entry in days"
                :key="entry.label"
                class="d-flex flex-column overflow-hidden"
            >
                <div
                    class="position-relative flex-grow-1"
                    :style="{ minHeight: `${PLOT_MIN_HEIGHT}px` }"
                >
                    <div
                        v-for="hour in HOURS"
                        :key="hour"
                        class="position-absolute w-100 border-t"
                        :style="{ top: `${(hour / 24) * 100}%` }"
                    />
                    <div
                        v-for="(block, index) in entry.blocks"
                        :key="index"
                        class="position-absolute w-100 bg-primary rounded-sm"
                        :style="{
                            top: `${block.top}%`,
                            height: `max(${block.height}%, ${MIN_BLOCK_HEIGHT}px)`,
                        }"
                    >
                        <v-tooltip
                            activator="parent"
                            location="top"
                            :text="block.tooltip"
                        />
                    </div>
                </div>
                <div
                    class="d-flex flex-column align-center border-t"
                    :style="{ height: `${FOOTER_HEIGHT}px` }"
                >
                    <div class="text-caption text-medium-emphasis text-truncate w-100 text-center">
                        {{ entry.label }}
                    </div>
                    <div class="text-caption font-weight-bold text-truncate w-100 text-center">
                        {{ entry.totalMs > 0 ? formatCompactDuration(entry.totalMs) : '' }}
                    </div>
                </div>
            </v-col>
        </v-row>
    </div>
</template>
