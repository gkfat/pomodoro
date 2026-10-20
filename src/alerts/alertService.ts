import type { PhaseEndedEvent } from '@/timer/types';

export type AlertChannel = {
    name: string;
    run: (event: PhaseEndedEvent) => void | Promise<void>;
};

// 只有工作結束播放提示音；休息結束僅以視覺提示（與系統通知）告知，不播放音樂。
export const playsAlertSound = (event: PhaseEndedEvent): boolean => event.phase === 'WORKING';

export type AlertFailure = {
    channel: string;
    message: string;
};

// 各管道獨立執行：任一失敗只記錄並回報，不阻斷其他管道。
export const dispatchAlerts = async (
    event: PhaseEndedEvent,
    channels: AlertChannel[],
): Promise<AlertFailure[]> => {
    const failures: AlertFailure[] = [];
    for (const channel of channels) {
        try {
            await channel.run(event);
        } catch (error) {
            console.error(`[alerts] ${channel.name} 提醒失敗`, error);
            failures.push({
                channel: channel.name,
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }
    return failures;
};
