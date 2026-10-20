// 一次性腳本：以 ElevenLabs Sound Effects API 生成 7 段約 5 秒的提示音（3 種鈴聲風格 + 4 種爵士／藍調），輸出到 public/sounds/。
// 用法：ELEVENLABS_API_KEY=<key> node scripts/generate-sounds.mjs [--force] [id ...]
// API key 只從環境變數讀取，不會寫入專案；成品 mp3 入庫後，執行時不再呼叫 ElevenLabs。
// 提示詞只描述樂器、情緒與節奏，不提及任何產品或曲名，避免生成近似既有鈴聲的內容。
import { Buffer } from 'node:buffer';
import {
    mkdir, stat, writeFile,
} from 'node:fs/promises';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const API_URL = 'https://api.elevenlabs.io/v1/sound-generation';
const DURATION_SECONDS = 5;
const PROMPT_INFLUENCE = 0.6;
const OUTPUT_DIR = fileURLToPath(new URL('../public/sounds/', import.meta.url));

const SOUNDS = [
    {
        id: 'marimba',
        prompt: 'An original short cheerful ringtone melody played on a bright marimba, '
            + 'a quick ascending arpeggio followed by a playful repeating phrase, dry and clean, '
            + 'about 5 seconds, ends with a clear final note, no background noise',
    },
    {
        id: 'glass-bell',
        prompt: 'An original short ringtone melody played on glass bells and a celesta, '
            + 'sparkling, gentle and elegant, a descending then rising four-note motif repeated twice, '
            + 'about 5 seconds, soft natural decay at the end, no background noise',
    },
    {
        id: 'harp',
        prompt: 'An original short notification melody played on a harp, '
            + 'a smooth rising glissando into a warm three-note resolution, calm and friendly, '
            + 'about 5 seconds, clean ending, no background noise',
    },
    {
        id: 'jazz-piano',
        prompt: 'An original short jazz piano phrase, warm upright piano with relaxed swing feel, '
            + 'a smooth walking melody with a bluesy grace note and a gentle seventh-chord ending, '
            + 'intimate and polished, about 5 seconds, natural decay, no background noise',
    },
    {
        id: 'blues-guitar',
        prompt: 'An original short blues guitar lick on a clean electric guitar, '
            + 'a soulful string bend into a quick descending pentatonic run, laid-back shuffle feel, '
            + 'about 5 seconds, ends on a sustained note with light vibrato, no background noise',
    },
    {
        id: 'vibraphone',
        prompt: 'An original short jazz motif played on a vibraphone with soft mallets, '
            + 'smooth shimmering notes with a mellow swing rhythm and a cool resolving chord, '
            + 'about 5 seconds, gentle sustain and fade, no background noise',
    },
    {
        id: 'muted-trumpet',
        prompt: 'An original short jazz phrase played on a muted trumpet, '
            + 'a smoky late-night lazy melody with a slight slide into the final note, '
            + 'soft brushed drums barely audible, about 5 seconds, clean ending, no background noise',
    },
];

const exists = async (path) => {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
};

const generate = async (apiKey, sound) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
            text: sound.prompt,
            duration_seconds: DURATION_SECONDS,
            prompt_influence: PROMPT_INFLUENCE,
        }),
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`ElevenLabs returned ${response.status} for "${sound.id}": ${detail}`);
    }
    return Buffer.from(await response.arrayBuffer());
};

const main = async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new Error('ELEVENLABS_API_KEY is not set. Run: ELEVENLABS_API_KEY=<key> node scripts/generate-sounds.mjs');
    }

    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const requested = args.filter((arg) => !arg.startsWith('--'));
    const targets = requested.length === 0
        ? SOUNDS
        : SOUNDS.filter((sound) => requested.includes(sound.id));
    const unknown = requested.filter((id) => !SOUNDS.some((sound) => sound.id === id));
    if (unknown.length > 0) {
        throw new Error(`Unknown sound id: ${unknown.join(', ')}. Valid ids: ${SOUNDS.map((sound) => sound.id).join(', ')}`);
    }

    await mkdir(OUTPUT_DIR, { recursive: true });
    for (const sound of targets) {
        const outputPath = `${OUTPUT_DIR}${sound.id}.mp3`;
        if (!force && await exists(outputPath)) {
            console.log(`skip   ${sound.id} (exists, use --force to regenerate)`);
            continue;
        }
        console.log(`create ${sound.id} ...`);
        const audio = await generate(apiKey, sound);
        await writeFile(outputPath, audio);
        console.log(`saved  public/sounds/${sound.id}.mp3 (${audio.length} bytes)`);
    }
};

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
