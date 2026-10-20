// 提示音目錄：設定型別、驗證與介面都由這裡推導，避免多處重複列舉。
// beep 為既有的合成音（無音檔）；其餘 7 種由 scripts/generate-sounds.mjs 生成並放在 public/sounds/。
const soundSrc = (id: string): string => `${import.meta.env.BASE_URL}sounds/${id}.mp3`;

export const ALERT_SOUNDS = [
    {
        id: 'beep', label: 'Beep', src: null, 
    },
    {
        id: 'marimba', label: 'Marimba', src: soundSrc('marimba'), 
    },
    {
        id: 'glass-bell', label: 'Glass Bell', src: soundSrc('glass-bell'), 
    },
    {
        id: 'harp', label: 'Harp', src: soundSrc('harp'), 
    },
    {
        id: 'jazz-piano', label: 'Jazz Piano', src: soundSrc('jazz-piano'), 
    },
    {
        id: 'blues-guitar', label: 'Blues Guitar', src: soundSrc('blues-guitar'), 
    },
    {
        id: 'vibraphone', label: 'Vibraphone', src: soundSrc('vibraphone'), 
    },
    {
        id: 'muted-trumpet', label: 'Muted Trumpet', src: soundSrc('muted-trumpet'), 
    },
] as const;

export type AlertSoundId = typeof ALERT_SOUNDS[number]['id'];

export const DEFAULT_ALERT_SOUND: AlertSoundId = 'beep';

export const isAlertSoundId = (value: unknown): value is AlertSoundId =>
    ALERT_SOUNDS.some((sound) => sound.id === value);

export const getAlertSoundSrc = (id: AlertSoundId): string | null =>
    ALERT_SOUNDS.find((sound) => sound.id === id)?.src ?? null;
