<script setup lang="ts">
import { formatBreakDuration } from '@/settings/format';
import {
    BREAK_SECOND_STEP, MAX_BREAK_SECONDS, MAX_MINUTES, MIN_BREAK_SECONDS, MIN_MINUTES, MINUTE_STEP,
} from '@/settings/types';
import type { Settings } from '@/settings/types';
import {
    validateBreakSeconds, validateMinutes, 
} from '@/settings/validation';

const props = defineProps<{
    settings: Settings;
    locked: boolean;
}>();

const emit = defineEmits<{
    update: [settings: Settings];
}>();

// slider 已限制範圍與步進，這裡仍驗證一次，避免非預期的值寫入設定。
const onWorkMinutes = (value: unknown): void => {
    if (typeof value !== 'number' || validateMinutes(value) !== null) {
        return;
    }
    emit('update', {
        ...props.settings, workMinutes: value, 
    });
};

const onBreakSeconds = (value: unknown): void => {
    if (typeof value !== 'number' || validateBreakSeconds(value) !== null) {
        return;
    }
    emit('update', {
        ...props.settings, breakSeconds: value, 
    });
};
</script>

<template>
    <div class="d-flex flex-column ga-4 w-100">
        <div>
            <div class="d-flex justify-space-between align-baseline">
                <div class="text-subtitle-2">
                    Focus time
                </div>
                <div class="text-h5 font-weight-bold">
                    {{ props.settings.workMinutes }} min
                </div>
            </div>
            <v-slider
                color="primary"
                :disabled="props.locked"
                hide-details
                :max="MAX_MINUTES"
                :min="MIN_MINUTES"
                :model-value="props.settings.workMinutes"
                :step="MINUTE_STEP"
                @update:model-value="onWorkMinutes"
            />
        </div>

        <div>
            <div class="d-flex justify-space-between align-baseline">
                <div class="text-subtitle-2">
                    Break time
                </div>
                <div class="text-h5 font-weight-bold">
                    {{ formatBreakDuration(props.settings.breakSeconds) }}
                </div>
            </div>
            <v-slider
                color="success"
                :disabled="props.locked"
                hide-details
                :max="MAX_BREAK_SECONDS"
                :min="MIN_BREAK_SECONDS"
                :model-value="props.settings.breakSeconds"
                :step="BREAK_SECOND_STEP"
                @update:model-value="onBreakSeconds"
            />
        </div>
    </div>
</template>
