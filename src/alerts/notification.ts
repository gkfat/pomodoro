export type NotificationSupport = NotificationPermission | 'unsupported';

export const getNotificationSupport = (): NotificationSupport =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;

// 僅在使用者主動啟用通知時呼叫，不在載入時主動詢問。
export const requestNotificationPermission = async (): Promise<NotificationSupport> => {
    if (typeof Notification === 'undefined') {
        return 'unsupported';
    }
    return Notification.requestPermission();
};

export const showSystemNotification = (title: string, body: string): void => {
    const support = getNotificationSupport();
    if (support === 'unsupported') {
        throw new Error('System notifications are not supported in this browser');
    }
    if (support !== 'granted') {
        throw new Error('System notification permission was not granted');
    }
    new Notification(title, { body });
};
