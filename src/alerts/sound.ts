const BEEP_FREQUENCY_HZ = 880;
const BEEP_DURATION_SECONDS = 0.4;
const BEEP_COUNT = 3;
const BEEP_GAP_SECONDS = 0.55;
const BEEP_GAIN = 0.2;

export type SoundPlayer = {
    unlock: () => void;
    play: () => Promise<void>;
};

// 以 Web Audio 合成提示音，不需音檔資產。AudioContext 需在使用者互動後 resume（autoplay 政策）。
export const createSoundPlayer = (): SoundPlayer => {
    let context: AudioContext | null = null;

    const getContext = (): AudioContext => {
        if (typeof AudioContext === 'undefined') {
            throw new Error('Web Audio is not supported in this browser');
        }
        context ??= new AudioContext();
        return context;
    };

    const unlock = (): void => {
        try {
            void getContext().resume();
        } catch (error) {
            console.warn('[alerts] 音效解鎖失敗', error);
        }
    };

    const play = async (): Promise<void> => {
        const audio = getContext();
        await audio.resume();
        if (audio.state !== 'running') {
            throw new Error('The browser has not allowed audio playback yet');
        }
        for (let index = 0; index < BEEP_COUNT; index += 1) {
            const startAt = audio.currentTime + index * BEEP_GAP_SECONDS;
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.frequency.value = BEEP_FREQUENCY_HZ;
            gain.gain.value = BEEP_GAIN;
            oscillator.connect(gain).connect(audio.destination);
            oscillator.start(startAt);
            oscillator.stop(startAt + BEEP_DURATION_SECONDS);
        }
    };

    return {
        unlock, play, 
    };
};
