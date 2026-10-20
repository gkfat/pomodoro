<script setup lang="ts">
import type { NotificationSupport } from '@/alerts/notification';
import {
    MAX_MINUTES, MIN_MINUTES, MINUTE_STEP, 
} from '@/settings/types';
import type { Settings } from '@/settings/types';
import { validateMinutes } from '@/settings/validation';

const props = defineProps<{
    settings: Settings;
    locked: boolean;
    notificationSupport: NotificationSupport;
}>();

const emit = defineEmits<{
    update: [settings: Settings];
    toggleNotification: [enabled: boolean];
}>();

type MinutesKey = 'workMinutes' | 'breakMinutes';

// slider 已限制範圍與步進，這裡仍驗證一次，避免非預期的值寫入設定。
const onMinutes = (key: MinutesKey, value: unknown): void => {
    if (typeof value !== 'number' || validateMinutes(value) !== null) {
        return;
    }
    emit('update', {
        ...props.settings, [key]: value, 
    });
};
</script>

<template>
    <div class="d-flex flex-column ga-6">
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
                @update:model-value="onMinutes('workMinutes', $event)"
            />
        </div>

        <div>
            <div class="d-flex justify-space-between align-baseline">
                <div class="text-subtitle-2">
                    Break time
                </div>
                <div class="text-h5 font-weight-bold">
                    {{ props.settings.breakMinutes }} min
                </div>
            </div>
            <v-slider
                color="success"
                :disabled="props.locked"
                hide-details
                :max="MAX_MINUTES"
                :min="MIN_MINUTES"
                :model-value="props.settings.breakMinutes"
                :step="MINUTE_STEP"
                @update:model-value="onMinutes('breakMinutes', $event)"
            />
        </div>

        <div>
            <v-switch
                color="primary"
                :disabled="props.notificationSupport === 'unsupported'"
                hide-details
                label="System notifications"
                :model-value="props.settings.systemNotification"
                @update:model-value="emit('toggleNotification', Boolean($event))"
            />
            <div
                v-if="props.notificationSupport === 'unsupported'"
                class="text-caption text-medium-emphasis"
            >
                This browser does not support system notifications
            </div>
            <div
                v-else-if="props.notificationSupport === 'denied'"
                class="text-caption text-medium-emphasis"
            >
                Notifications are blocked. Enable them in your browser settings.
            </div>
        </div>
    </div>
</template>
