import {
    afterEach, beforeEach, describe, expect, it, vi, 
} from 'vitest';

import { createSoundPlayer } from './sound';
import {
    ALERT_SOUNDS, DEFAULT_ALERT_SOUND, getAlertSoundSrc, isAlertSoundId, 
} from './soundCatalog';

describe('soundCatalog', () => {
    it('lists the beep and seven generated sounds with unique ids and labels', () => {
        expect(ALERT_SOUNDS).toHaveLength(8);
        expect(new Set(ALERT_SOUNDS.map((sound) => sound.id)).size).toBe(8);
        expect(new Set(ALERT_SOUNDS.map((sound) => sound.label)).size).toBe(8);
    });

    it('defaults to beep, which has no audio file', () => {
        expect(DEFAULT_ALERT_SOUND).toBe('beep');
        expect(getAlertSoundSrc('beep')).toBeNull();
    });

    it('gives every generated sound a static mp3 path', () => {
        const generated = ALERT_SOUNDS.filter((sound) => sound.id !== 'beep');
        expect(generated).toHaveLength(7);
        for (const sound of generated) {
            expect(sound.src).toMatch(/sounds\/.+\.mp3$/);
        }
    });

    it('recognises only catalog ids', () => {
        expect(isAlertSoundId('harp')).toBe(true);
        expect(isAlertSoundId('ringtone')).toBe(false);
        expect(isAlertSoundId(1)).toBe(false);
    });
});

type FakeContext = {
    state: AudioContextState;
    currentTime: number;
    destination: object;
    resume: ReturnType<typeof vi.fn>;
    decodeAudioData: ReturnType<typeof vi.fn>;
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    createBufferSource: ReturnType<typeof vi.fn>;
};

const createFakeContext = (state: AudioContextState = 'running'): FakeContext => {
    const node = () => ({
        connect: vi.fn(function connect(this: unknown) { return this; }),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
        gain: { value: 0 },
    });
    return {
        state,
        currentTime: 0,
        destination: {},
        resume: vi.fn(() => Promise.resolve()),
        decodeAudioData: vi.fn(() => Promise.resolve({ duration: 5 })),
        createOscillator: vi.fn(node),
        createGain: vi.fn(node),
        createBufferSource: vi.fn(node),
    };
};

describe('createSoundPlayer', () => {
    let context: FakeContext;

    beforeEach(() => {
        context = createFakeContext();
        // 以 class 提供可 new 的建構子，並回傳測試用的假 context
        vi.stubGlobal('AudioContext', class {
            constructor() {
                return context;
            }
        });
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
            ok: true,
            status: 200,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        })));
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('plays the synthesized beep for the beep id without fetching', async () => {
        await createSoundPlayer().play('beep');
        expect(fetch).not.toHaveBeenCalled();
        expect(context.createOscillator).toHaveBeenCalledTimes(3);
    });

    it('plays a decoded audio file for a generated sound', async () => {
        await createSoundPlayer().play('marimba');
        expect(fetch).toHaveBeenCalledOnce();
        expect(context.createBufferSource).toHaveBeenCalledOnce();
        expect(context.createOscillator).not.toHaveBeenCalled();
    });

    it('plays at maximum gain for both the beep and audio files', async () => {
        const gains: number[] = [];
        context.createGain.mockImplementation(() => {
            const gainNode = {
                connect: vi.fn(function connect(this: unknown) { return this; }),
                gain: { value: 0 },
            };
            gains.push(0);
            const index = gains.length - 1;
            Object.defineProperty(gainNode.gain, 'value', {
                set: (value: number) => { gains[index] = value; },
                get: () => gains[index],
            });
            return gainNode;
        });
        const player = createSoundPlayer();
        await player.play('beep');
        await player.play('marimba');
        expect(gains.length).toBeGreaterThan(0);
        expect(gains.every((value) => value === 1)).toBe(true);
    });

    it('caches decoded buffers per id', async () => {
        const player = createSoundPlayer();
        await player.play('harp');
        await player.play('harp');
        expect(fetch).toHaveBeenCalledOnce();
        expect(context.createBufferSource).toHaveBeenCalledTimes(2);
    });

    it('falls back to the beep when the audio file fails to load', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
            ok: false, status: 404, 
        })));
        await createSoundPlayer().play('glass-bell');
        expect(context.createOscillator).toHaveBeenCalledTimes(3);
        expect(console.error).toHaveBeenCalled();
    });

    it('falls back to the beep when decoding fails', async () => {
        context.decodeAudioData.mockRejectedValue(new Error('bad data'));
        await createSoundPlayer().play('jazz-piano');
        expect(context.createOscillator).toHaveBeenCalledTimes(3);
    });

    it('retries loading after a failure instead of caching it', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({
                ok: false, status: 500, 
            })
            .mockResolvedValue({
                ok: true, status: 200, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)), 
            });
        vi.stubGlobal('fetch', fetchMock);
        const player = createSoundPlayer();
        await player.play('vibraphone');
        await player.play('vibraphone');
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(context.createBufferSource).toHaveBeenCalledOnce();
    });

    it('reports an error when the browser does not allow playback', async () => {
        context.state = 'suspended';
        await expect(createSoundPlayer().play('marimba')).rejects.toThrow('not allowed');
    });

    it('reports an error when Web Audio is unavailable', async () => {
        vi.stubGlobal('AudioContext', undefined);
        await expect(createSoundPlayer().play('beep')).rejects.toThrow('not supported');
    });

    it('preload fetches generated sounds once and ignores beep', async () => {
        const player = createSoundPlayer();
        player.preload('beep');
        player.preload('marimba');
        player.preload('marimba');
        await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalledOnce());
        expect(fetch).toHaveBeenCalledOnce();
    });
});
