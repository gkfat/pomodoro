<script setup lang="ts">
import {
    computed, ref, 
} from 'vue';

import { useClock } from '@/clock/clock';
import { getAxisStartHour } from '@/stats/axis';
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
const HOURS_PER_DAY = 24;
const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
// 縱軸每小時一條分隔線；標籤每 3 小時標一次，避免擠在一起。
const LABEL_EVERY_HOURS = 3;

const {
    timestamp, todayStart, today,
} = useClock();
// 視窗最後一天往前推幾天；0 代表最後一天是今日（不可再往後）。
const daysBack = ref(0);

const dayEntries = computed(() => Array.from({ length: VISIBLE_DAYS }, (_, index) => {
    const date = new Date(
        today.value.getFullYear(), today.value.getMonth(), today.value.getDate() - daysBack.value - (VISIBLE_DAYS - 1 - index),
    );
    const dayStart = date.getTime();
    return {
        date, dayStart, sessions: props.cyclesByDate[toDateKey(dayStart)] ?? [],
    };
}));

// 縱軸從可見日期中最早專注的前一小時開始（跨午夜的部分裁切為 00:00）。
const axisStartHour = computed(() => getAxisStartHour(
    dayEntries.value.flatMap((entry) =>
        entry.sessions.map((session) => Math.max(0, session.startedAt - entry.dayStart))),
));
const axisSpanMs = computed(() => (HOURS_PER_DAY - axisStartHour.value) * MS_PER_HOUR);

// 時間（距當日 00:00 的毫秒）在可見縱軸上的位置百分比，超出範圍則裁切。
const percent = (ms: number): number =>
    (Math.min(axisSpanMs.value, Math.max(0, ms - axisStartHour.value * MS_PER_HOUR)) / axisSpanMs.value) * 100;

const hourTop = (hour: number): number => percent(hour * MS_PER_HOUR);

const visibleHours = computed(() => HOURS.filter((hour) => hour >= axisStartHour.value));
const labelHours = computed(() => visibleHours.value.filter((hour) => hour % LABEL_EVERY_HOURS === 0));

// 現在時間線：以分鐘為單位更新（避免每次 tick 都重繪）；視窗不含今日、或現在早於縱軸起點時不顯示。
const nowLine = computed<{ top: number; label: string } | null>(() => {
    if (daysBack.value !== 0) {
        return null;
    }
    const minuteStart = Math.floor(timestamp.value / MS_PER_MINUTE) * MS_PER_MINUTE;
    const offsetMs = minuteStart - todayStart.value;
    if (offsetMs < axisStartHour.value * MS_PER_HOUR) {
        return null;
    }
    return {
        top: percent(offsetMs), label: formatClock(minuteStart),
    };
});

const days = computed(() => dayEntries.value.map(({
    date, dayStart, sessions,
}) => {
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
            <div class="text-title-small text-medium-emphasis">
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
            class="ga-1 flex-nowrap flex-grow-1 position-relative"
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
                        v-for="hour in labelHours"
                        :key="hour"
                        class="position-absolute text-body-small text-medium-emphasis"
                        :style="{ top: `${hourTop(hour)}%` }"
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
                        v-for="hour in visibleHours"
                        :key="hour"
                        class="position-absolute w-100 border-t"
                        :style="{ top: `${hourTop(hour)}%` }"
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
                    <div class="text-body-small text-medium-emphasis text-truncate w-100 text-center">
                        {{ entry.label }}
                    </div>
                    <div class="text-body-small font-weight-bold text-truncate w-100 text-center">
                        {{ entry.totalMs > 0 ? formatCompactDuration(entry.totalMs) : '' }}
                    </div>
                </div>
            </v-col>
            <!-- 現在時間線：只橫跨日期欄（左側讓出時間軸欄，不遮住標籤），右端標示目前 HH:mm；高度需扣除底部日期列。 -->
            <div
                v-if="nowLine !== null"
                class="position-absolute bg-now pointer-events-none"
                :style="{
                    top: `calc((100% - ${FOOTER_HEIGHT}px) * ${nowLine.top / 100})`,
                    left: `calc(${100 / 12}% + 4px)`,
                    right: 0,
                    height: '2px',
                }"
            >
                <span
                    class="position-absolute bg-now text-background text-label-small px-1 rounded-sm"
                    :style="{
                        right: 0, top: '2px',
                    }"
                >
                    {{ nowLine.label }}
                </span>
            </div>
        </v-row>
    </div>
</template>
