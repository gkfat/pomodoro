<script setup lang="ts">
import {
    computed, ref, watch, 
} from 'vue';

import { useClock } from '@/clock/clock';
import { buildMonthGrid } from '@/stats/calendar';
import { toDateKey } from '@/stats/date';
import { formatCompactDuration } from '@/stats/format';
import { sumDurationMs } from '@/stats/history';
import type { CyclesByDate } from '@/stats/history';

const WEEKDAYS = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
] as const;

const props = defineProps<{
    cyclesByDate: CyclesByDate;
    // md 以上：格子縮成單行，有專注的日子改以底色標示，時長移到 tooltip。
    compact?: boolean;
}>();

const { today } = useClock();
const viewYear = ref(today.value.getFullYear());
const viewMonth = ref(today.value.getMonth());

// 跨日後若原本停在「今天所在的月份」，跟著切到新的當月；瀏覽其他月份時不干擾。
watch(today, (next, previous) => {
    const followsToday = viewYear.value === previous.getFullYear() && viewMonth.value === previous.getMonth();
    if (!followsToday) {
        return;
    }
    viewYear.value = next.getFullYear();
    viewMonth.value = next.getMonth();
});

const weeks = computed(() => buildMonthGrid(viewYear.value, viewMonth.value));

const title = computed(() =>
    new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('en-US', {
        month: 'long', year: 'numeric',
    }));

// Date 會自動處理月份進退位（0 月 -1 → 前一年 12 月）。
const shiftMonth = (delta: number): void => {
    const next = new Date(viewYear.value, viewMonth.value + delta, 1);
    viewYear.value = next.getFullYear();
    viewMonth.value = next.getMonth();
};

// 當天所有專注輪次的總時長（ms）；沒有紀錄回傳 0。
const dayTotalMs = (day: number): number => {
    return sumDurationMs(props.cyclesByDate[toDateKey(new Date(viewYear.value, viewMonth.value, day).getTime())] ?? []);
};

const isToday = (day: number): boolean =>
    viewYear.value === today.value.getFullYear()
    && viewMonth.value === today.value.getMonth()
    && day === today.value.getDate();

const hasFocus = (day: number | null): boolean => day !== null && dayTotalMs(day) > 0;

// 週日(0)與週六(6)整欄改用較淡的 surface-variant；平日用 surface。
const isWeekend = (column: number): boolean => column === 0 || column === 6;
const cellColor = (column: number): string => (isWeekend(column) ? 'surface-variant' : 'surface');

// compact 時有專注的日子整格改為主色（淡粉）。
const dayColor = (day: number | null, column: number): string | undefined => {
    if (day === null) {
        return undefined;
    }
    return props.compact && hasFocus(day) ? 'primary' : cellColor(column);
};

// 今日框線與主色底色同色會看不見，專注日改用文字色。
const todayBorder = (day: number | null): string | false => {
    if (day === null || !isToday(day)) {
        return false;
    }
    return props.compact && hasFocus(day) ? 'on-surface md' : 'primary md';
};
</script>

<template>
    <div
        class="calendar-panel d-flex flex-column flex-grow-0 w-100"
    >
        <div
            class="d-flex align-center justify-space-between"
            :class="props.compact ? 'mb-1' : 'mb-2'"
        >
            <v-btn
                aria-label="Previous month"
                :density="props.compact ? 'compact' : 'default'"
                icon="mdi-chevron-left"
                variant="text"
                @click="shiftMonth(-1)"
            />
            <div
                class="font-weight-bold"
                :class="props.compact ? 'text-body-2' : 'text-subtitle-1'"
            >
                {{ title }}
            </div>
            <v-btn
                aria-label="Next month"
                :density="props.compact ? 'compact' : 'default'"
                icon="mdi-chevron-right"
                variant="text"
                @click="shiftMonth(1)"
            />
        </div>

        <v-row
            class="ga-1 mb-1 flex-grow-0"
            no-gutters
        >
            <v-col
                v-for="(name, column) in WEEKDAYS"
                :key="name"
            >
                <v-sheet
                    class="d-flex align-center justify-center text-caption text-medium-emphasis"
                    :color="cellColor(column)"
                    :height="props.compact ? 20 : 28"
                    rounded
                >
                    {{ name }}
                </v-sheet>
            </v-col>
        </v-row>

        <v-row
            v-for="(week, weekIndex) in weeks"
            :key="weekIndex"
            class="ga-1 mb-1 flex-nowrap flex-grow-0"
            no-gutters
        >
            <v-col
                v-for="(day, column) in week"
                :key="column"
                class="d-flex overflow-hidden"
            >
                <v-sheet
                    class="d-flex flex-column flex-grow-1 align-center"
                    :border="todayBorder(day)"
                    :class="[
                        props.compact ? 'justify-center text-caption' : 'justify-start pt-1 text-body-2',
                        { 'font-weight-bold border-opacity-100': day !== null && isToday(day) },
                    ]"
                    :color="dayColor(day, column)"
                    :min-height="props.compact ? 24 : 48"
                    rounded
                >
                    <span>{{ day }}</span>
                    <v-tooltip
                        v-if="props.compact && day !== null && hasFocus(day)"
                        activator="parent"
                        location="top"
                        :text="formatCompactDuration(dayTotalMs(day))"
                    />
                    <span
                        v-else-if="!props.compact && day !== null && hasFocus(day)"
                        class="text-caption text-primary text-truncate w-100 text-center px-1"
                    >
                        {{ formatCompactDuration(dayTotalMs(day)) }}
                    </span>
                </v-sheet>
            </v-col>
        </v-row>
    </div>
</template>
