<script setup lang="ts">
import {
    computed, ref, 
} from 'vue';

import SettingsPanel from '@/components/SettingsPanel.vue';
import TimerPanel from '@/components/TimerPanel.vue';
import { useTimer } from '@/composables/useTimer';

const timer = useTimer();
const showSettings = ref(false);

const showNotice = computed({
    get: () => timer.notice.value !== null,
    set: (value: boolean) => {
        if (!value) {
            timer.notice.value = null;
        }
    },
});
</script>

<template>
    <v-app
        class="app-root"
        :class="timer.isBreak.value ? 'bg-background-break' : 'bg-background'"
    >
        <v-main>
            <v-container class="d-flex flex-column align-center justify-space-evenly fill-height py-8 app-column">
                <h1 class="text-h5 font-weight-bold">
                    pomodoro
                </h1>
                <v-alert
                    v-if="timer.errorMessage.value"
                    closable
                    type="warning"
                    @click:close="timer.errorMessage.value = null"
                >
                    {{ timer.errorMessage.value }}
                </v-alert>
                <TimerPanel
                    :is-break="timer.isBreak.value"
                    :today-focus-text="timer.todayFocusText.value"
                    :next-alert-text="timer.nextAlertText.value"
                    :progress="timer.progress.value"
                    :remaining-text="timer.remainingText.value"
                    :state="timer.state.value"
                    @pause="timer.pause"
                    @reset="timer.reset"
                    @resume="timer.resume"
                    @start="timer.start"
                    @start-test="timer.startTest"
                />
                <v-btn
                    aria-label="Settings"
                    icon="mdi-cog"
                    size="large"
                    variant="text"
                    @click="showSettings = true"
                />
            </v-container>

            <v-dialog
                v-model="showSettings"
                fullscreen
                transition="dialog-bottom-transition"
            >
                <v-card
                    class="d-flex flex-column"
                    flat
                    min-height="100%"
                    rounded="0"
                >
                    <v-container class="app-column pt-12">
                        <SettingsPanel
                            :locked="timer.isSettingsLocked.value"
                            :notification-support="timer.notificationSupport.value"
                            :preview-error="timer.previewError.value"
                            :settings="timer.settings.value"
                            @preview-sound="timer.previewSound"
                            @toggle-notification="timer.enableSystemNotification"
                            @update="timer.updateSettings"
                        />
                    </v-container>
                    <v-spacer />
                    <div class="d-flex justify-center pb-8">
                        <v-btn
                            aria-label="Close settings"
                            icon="mdi-close"
                            size="large"
                            variant="tonal"
                            @click="showSettings = false"
                        />
                    </div>
                </v-card>
            </v-dialog>

            <v-snackbar
                v-model="showNotice"
                color="primary"
                timeout="-1"
            >
                {{ timer.notice.value }}
                <template #actions>
                    <v-btn @click="showNotice = false">
                        Dismiss
                    </v-btn>
                </template>
            </v-snackbar>
        </v-main>
    </v-app>
</template>

<style scoped>
/* 維持手機直式單欄寬度；Vuetify container 在桌機會撐滿寬度。 */
.app-column {
    max-width: 420px;
}

/* 專注／休息只以底色區分，換色時淡入淡出。 */
.app-root {
    transition: background-color 0.6s ease;
}

@media (prefers-reduced-motion: reduce) {
    .app-root {
        transition: none;
    }
}
</style>

<style>
/* 全站使用等寬字體：Vuetify 的 body / heading 字體都由這兩個 CSS 變數決定。 */
:root {
    --v-font-body: ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
    --v-font-heading: var(--v-font-body);
}
</style>
