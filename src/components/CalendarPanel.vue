<script setup lang="ts">
import {
    computed, ref, 
} from 'vue';

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
}>();

const today = new Date();
const viewYear = ref(today.getFullYear());
const viewMonth = ref(today.getMonth());

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
    viewYear.value === today.getFullYear()
    && viewMonth.value === today.getMonth()
    && day === today.getDate();

// 週日(0)與週六(6)整欄改用較淡的 surface-variant；平日用 surface。
const isWeekend = (column: number): boolean => column === 0 || column === 6;
const cellColor = (column: number): string => (isWeekend(column) ? 'surface-variant' : 'surface');
</script>

<template>
    <div
        class="calendar-panel d-flex flex-column flex-grow-0 w-100"
    >
        <div class="d-flex align-center justify-space-between mb-2">
            <v-btn
                aria-label="Previous month"
                icon="mdi-chevron-left"
                variant="text"
                @click="shiftMonth(-1)"
            />
            <div class="text-subtitle-1 font-weight-bold">
                {{ title }}
            </div>
            <v-btn
                aria-label="Next month"
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
                    height="28"
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
                    class="d-flex flex-column flex-grow-1 align-center justify-start pt-1 text-body-2"
                    :border="day !== null && isToday(day) ? 'primary md' : false"
                    :class="{
                        'font-weight-bold border-opacity-100': day !== null && isToday(day),
                    }"
                    :color="day === null ? undefined : cellColor(column)"
                    min-height="48"
                    rounded
                >
                    <span>{{ day }}</span>
                    <span
                        v-if="day !== null && dayTotalMs(day) > 0"
                        class="text-caption text-primary text-truncate w-100 text-center px-1"
                    >
                        {{ formatCompactDuration(dayTotalMs(day)) }}
                    </span>
                </v-sheet>
            </v-col>
        </v-row>
    </div>
</template>
