import { getAlertSoundSrc } from './soundCatalog';
import type { AlertSoundId } from './soundCatalog';

const BEEP_FREQUENCY_HZ = 880;
const BEEP_DURATION_SECONDS = 0.4;
const BEEP_COUNT = 3;
const BEEP_GAP_SECONDS = 0.55;
// 一律以最大音量播放（Web Audio 增益上限 1，不放大以免失真）；不修改使用者的系統或喇叭音量。
const PLAYBACK_GAIN = 1;
// 開始專注的提示：兩個短促的上行音，音量比結束提示輕。
const START_CUE_FREQUENCIES_HZ = [660, 880] as const;
const START_CUE_NOTE_SECONDS = 0.1;
const START_CUE_GAIN = 0.4;

export type SoundPlayer = {
    unlock: () => void;
    preload: (id: AlertSoundId) => void;
    play: (id: AlertSoundId) => Promise<void>;
    playStart: () => Promise<void>;
};

// 提示音播放器。AudioContext 需在使用者互動後 resume（autoplay 政策）。
// 音檔以 fetch + decodeAudioData 解碼並依 id 快取；載入或播放失敗時退回合成的 Beep。
export const createSoundPlayer = (): SoundPlayer => {
    let context: AudioContext | null = null;
    const buffers = new Map<AlertSoundId, Promise<AudioBuffer>>();

    const getContext = (): AudioContext => {
        if (typeof AudioContext === 'undefined') {
            throw new Error('Web Audio is not supported in this browser');
        }
        context ??= new AudioContext();
        return context;
    };

    const getRunningContext = async (): Promise<AudioContext> => {
        const audio = getContext();
        await audio.resume();
        if (audio.state !== 'running') {
            throw new Error('The browser has not allowed audio playback yet');
        }
        return audio;
    };

    const loadBuffer = (id: AlertSoundId): Promise<AudioBuffer> => {
        const cached = buffers.get(id);
        if (cached) {
            return cached;
        }
        const src = getAlertSoundSrc(id);
        if (src === null) {
            return Promise.reject(new Error(`Sound "${id}" has no audio file`));
        }
        const loading = fetch(src)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${src}: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then((data) => getContext().decodeAudioData(data));
        buffers.set(id, loading);
        // 失敗的載入不快取，下次可重試
        loading.catch(() => buffers.delete(id));
        return loading;
    };

    const playBeep = (audio: AudioContext): void => {
        for (let index = 0; index < BEEP_COUNT; index += 1) {
            const startAt = audio.currentTime + index * BEEP_GAP_SECONDS;
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.frequency.value = BEEP_FREQUENCY_HZ;
            gain.gain.value = PLAYBACK_GAIN;
            oscillator.connect(gain).connect(audio.destination);
            oscillator.start(startAt);
            oscillator.stop(startAt + BEEP_DURATION_SECONDS);
        }
    };

    const playBuffer = (audio: AudioContext, buffer: AudioBuffer): void => {
        const source = audio.createBufferSource();
        const gain = audio.createGain();
        gain.gain.value = PLAYBACK_GAIN;
        source.buffer = buffer;
        source.connect(gain).connect(audio.destination);
        source.start();
    };

    const playStartCue = (audio: AudioContext): void => {
        START_CUE_FREQUENCIES_HZ.forEach((frequency, index) => {
            const startAt = audio.currentTime + index * START_CUE_NOTE_SECONDS;
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.frequency.value = frequency;
            gain.gain.value = START_CUE_GAIN;
            oscillator.connect(gain).connect(audio.destination);
            oscillator.start(startAt);
            oscillator.stop(startAt + START_CUE_NOTE_SECONDS);
        });
    };

    const unlock = (): void => {
        try {
            void getContext().resume();
        } catch (error) {
            console.warn('[alerts] 音效解鎖失敗', error);
        }
    };

    const preload = (id: AlertSoundId): void => {
        if (getAlertSoundSrc(id) === null) {
            return;
        }
        loadBuffer(id).catch((error: unknown) => {
            console.warn(`[alerts] 預先載入 ${id} 失敗`, error);
        });
    };

    const play = async (id: AlertSoundId): Promise<void> => {
        const audio = await getRunningContext();
        if (getAlertSoundSrc(id) === null) {
            playBeep(audio);
            return;
        }
        try {
            playBuffer(audio, await loadBuffer(id));
        } catch (error) {
            console.error(`[alerts] 播放 ${id} 失敗，改播 Beep`, error);
            playBeep(audio);
        }
    };

    const playStart = async (): Promise<void> => {
        playStartCue(await getRunningContext());
    };

    return {
        unlock, preload, play, playStart, 
    };
};
