<script setup lang="ts">
import {
    computed, ref, 
} from 'vue';

import { useDisplay } from 'vuetify';

import CalendarPanel from '@/components/CalendarPanel.vue';
import DurationSettings from '@/components/DurationSettings.vue';
import FocusChart from '@/components/FocusChart.vue';
import AppVersion from '@/components/AppVersion.vue';
import SettingsPanel from '@/components/SettingsPanel.vue';
import TimerPanel from '@/components/TimerPanel.vue';
import { useTimer } from '@/composables/useTimer';

const timer = useTimer();
const showSettings = ref(false);
// 計時開始後（專注、休息、暫停）進入專注模式：只留時鐘，其餘區塊與 header 全部隱藏。
const isFocusMode = computed(() => timer.state.value.status !== 'IDLE');

// 小於 sm（xs）時改為底部導覽，一次只顯示一個區塊；較寬時全部並列。
type MobileTab = 'summary' | 'focus' | 'daily';
const {
    xs, mdAndUp, 
} = useDisplay();
const mobileTab = ref<MobileTab>('focus');
const isShown = (tab: MobileTab): boolean => !xs.value || mobileTab.value === tab;

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
        <v-app-bar
            v-if="!isFocusMode"
            color="transparent"
            density="compact"
            flat
        >
            <v-app-bar-title class="text-h6 font-weight-bold">
                pomodoro
            </v-app-bar-title>
            <v-btn
                aria-label="Settings"
                icon="mdi-cog"
                variant="text"
                @click="showSettings = true"
            />
        </v-app-bar>
        <v-main>
            <v-container class="d-flex flex-column align-center justify-space-evenly fill-height py-2 app-main">
                <v-alert
                    v-if="timer.errorMessage.value"
                    closable
                    type="warning"
                    @click:close="timer.errorMessage.value = null"
                >
                    {{ timer.errorMessage.value }}
                </v-alert>
                <v-row
                    class="w-100 flex-grow-1"
                    no-gutters
                >
                    <!-- 左欄：月曆在上、計時器在下；右欄：daily 佔滿全高。 -->
                    <v-col
                        v-show="isFocusMode || isShown('focus') || isShown('summary')"
                        class="d-flex flex-column align-center justify-space-evenly ga-8 px-0 px-md-4 py-4"
                        cols="12"
                        :md="isFocusMode ? 12 : 6"
                    >
                        <CalendarPanel
                            v-show="!isFocusMode && isShown('summary')"
                            :compact="mdAndUp"
                            :cycles-by-date="timer.focusHistory.value"
                        />
                        <div
                            v-show="isFocusMode || isShown('focus')"
                            class="d-flex flex-column align-center justify-space-evenly flex-grow-1 ga-6 w-100"
                        >
                            <TimerPanel
                                :compact="mdAndUp && !isFocusMode"
                                :is-break="timer.isBreak.value"
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
                            <DurationSettings
                                v-if="!isFocusMode"
                                :locked="timer.isSettingsLocked.value"
                                :settings="timer.settings.value"
                                @update="timer.updateSettings"
                            />
                        </div>
                    </v-col>
                    <v-col
                        v-show="!isFocusMode && isShown('daily')"
                        class="d-flex flex-column align-center px-0 px-md-4 py-4"
                        cols="12"
                        md="6"
                    >
                        <FocusChart
                            :cycles-by-date="timer.focusHistory.value"
                        />
                    </v-col>
                </v-row>
            </v-container>

            <v-dialog
                v-if="!mdAndUp"
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
                    <AppVersion class="mb-4" />
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

        <!-- md 以上：設定改為右側抽屜，關閉鈕在右上角。 -->
        <v-navigation-drawer
            v-if="mdAndUp"
            v-model="showSettings"
            location="right"
            temporary
            width="360"
        >
            <div class="d-flex justify-end pa-2">
                <v-btn
                    aria-label="Close settings"
                    icon="mdi-close"
                    variant="text"
                    @click="showSettings = false"
                />
            </div>
            <div class="px-6 pb-6">
                <SettingsPanel
                    :locked="timer.isSettingsLocked.value"
                    :notification-support="timer.notificationSupport.value"
                    :preview-error="timer.previewError.value"
                    :settings="timer.settings.value"
                    @preview-sound="timer.previewSound"
                    @toggle-notification="timer.enableSystemNotification"
                    @update="timer.updateSettings"
                />
            </div>
            <template #append>
                <AppVersion class="pa-4" />
            </template>
        </v-navigation-drawer>

        <v-bottom-navigation
            v-if="xs && !isFocusMode"
            v-model="mobileTab"
            color="primary"
            grow
        >
            <v-btn value="summary">
                <v-icon>mdi-calendar-month</v-icon>
                Summary
            </v-btn>
            <v-btn value="focus">
                <v-icon>mdi-timer-outline</v-icon>
                Focus
            </v-btn>
            <v-btn value="daily">
                <v-icon>mdi-chart-bar</v-icon>
                Daily
            </v-btn>
        </v-bottom-navigation>
    </v-app>
</template>

<style scoped>
/* 主畫面左右兩欄（時鐘／月曆）；窄螢幕自動堆疊成單欄。 */
.app-main {
    max-width: 960px;
}

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
