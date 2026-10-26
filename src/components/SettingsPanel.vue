<script setup lang="ts">
import type { NotificationSupport } from '@/alerts/notification';
import {
    ALERT_SOUNDS, isAlertSoundId, 
} from '@/alerts/soundCatalog';
import type { Settings } from '@/settings/types';

const props = defineProps<{
    settings: Settings;
    locked: boolean;
    notificationSupport: NotificationSupport;
    previewError: string | null;
}>();

const emit = defineEmits<{
    update: [settings: Settings];
    toggleNotification: [enabled: boolean];
    previewSound: [];
}>();

const onAlertSound = (value: unknown): void => {
    if (!isAlertSoundId(value)) {
        return;
    }
    emit('update', {
        ...props.settings, alertSound: value, 
    });
};
</script>

<template>
    <div class="d-flex flex-column ga-6">
        <div>
            <div class="d-flex justify-space-between align-center">
                <div class="text-title-small">
                    Alert sound
                </div>
                <v-btn
                    aria-label="Preview alert sound"
                    density="comfortable"
                    icon="mdi-play"
                    variant="tonal"
                    @click="emit('previewSound')"
                />
            </div>
            <v-select
                class="mt-2"
                density="comfortable"
                :disabled="props.locked"
                hide-details
                item-title="label"
                item-value="id"
                :items="ALERT_SOUNDS"
                :model-value="props.settings.alertSound"
                @update:model-value="onAlertSound"
            />
            <div
                v-if="props.previewError"
                class="text-body-small text-error mt-1"
            >
                {{ props.previewError }}
            </div>
        </div>

        <div>
            <div class="d-flex justify-space-between align-center">
                <div class="text-title-small">
                    System notifications
                </div>
                <v-switch
                    color="primary"
                    density="comfortable"
                    :disabled="props.notificationSupport === 'unsupported'"
                    hide-details
                    :model-value="props.settings.systemNotification"
                    @update:model-value="emit('toggleNotification', Boolean($event))"
                />
            </div>
            <div
                v-if="props.notificationSupport === 'unsupported'"
                class="text-body-small text-medium-emphasis"
            >
                This browser does not support system notifications
            </div>
            <div
                v-else-if="props.notificationSupport === 'denied'"
                class="text-body-small text-medium-emphasis"
            >
                Notifications are blocked. Enable them in your browser settings.
            </div>
        </div>
    </div>
</template>
