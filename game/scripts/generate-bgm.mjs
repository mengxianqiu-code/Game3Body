// scripts/generate-bgm.mjs
// 调用 MiniMax Music-01 API 生成 4 段章节 BGM，存到 public/audio/
// 用法：
//   node scripts/generate-bgm.mjs                  # 生成全部
//   node scripts/generate-bgm.mjs --only=1,3      # 只生成第 1、3 章
//   node scripts/generate-bgm.mjs --force         # 已存在的也重新生成

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_PATH = resolve(ROOT, '..', '.env');
const OUT_DIR = resolve(ROOT, 'public', 'audio');

const API_URL = 'https://api.minimaxi.com/v1/music_generation';
const MODEL = 'music-02';

/* ============== 4 段 BGM 的 prompt ============== */
const TRACKS = [
  {
    id: 1,
    file: 'ch1.mp3',
    prompt:
      'Atmospheric sci-fi ambient, mysterious radio signals from deep space, ethereal synth pads, slow hypnotic pulse rhythm, cinematic, contemplative, sense of first contact, dark cosmic atmosphere, 70 BPM, instrumental, no vocals',
    lyrics: '[Instrumental]\n[Soft pulses]\n[Ambient texture]\n[End]',
  },
  {
    id: 2,
    file: 'ch2.mp3',
    prompt:
      'Tense sci-fi action, driving percussion, urgent staccato strings, stealth pursuit through asteroid field, dark cinematic, anxious fast tempo, 130 BPM, instrumental, no vocals',
    lyrics: '[Instrumental]\n[Driving rhythm]\n[Urgent pulse]\n[End]',
  },
  {
    id: 3,
    file: 'ch3.mp3',
    prompt:
      'Dark sci-fi thriller, suspenseful, low-frequency drones, subtle rhythmic pulse, psychological tension, minimalist, ominous, sense of impending doom, 90 BPM, instrumental, no vocals',
    lyrics: '[Instrumental]\n[Low drones]\n[Subtle pulse]\n[Tension]\n[End]',
  },
  {
    id: 4,
    file: 'ch4.mp3',
    prompt:
      'Epic hopeful sci-fi orchestral, soaring synths and strings, emotional climax, transcendence from three dimensions, uplifting yet melancholic, redemption, 100 BPM, instrumental, no vocals',
    lyrics: '[Instrumental]\n[Soaring theme]\n[Hopeful pulse]\n[Resolution]\n[End]',
  },
];

/* ============== 工具 ============== */
function parseArgs() {
  const args = process.argv.slice(2);
  const out = { only: null, force: false };
  for (const a of args) {
    if (a.startsWith('--only=')) out.only = a.slice(7).split(',').map(Number);
    else if (a === '--force') out.force = true;
  }
  return out;
}

async function loadApiKey() {
  const raw = await readFile(ENV_PATH, 'utf8');
  // 极简 .env 解析：匹配 KEY="VALUE" 或 KEY=VALUE
  const m = raw.match(/^\s*key\s*=\s*"?([^"\n]+)"?\s*$/m);
  if (!m) throw new Error(`.env 里找不到 key=...（已检查 ${ENV_PATH}）`);
  return m[1].trim();
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

/* ============== 调用 API ============== */
async function generateTrack(apiKey, track) {
  const body = {
    model: MODEL,
    prompt: track.prompt,
    lyrics: track.lyrics,
    audio_setting: {
      sample_rate: 44100,
      bitrate: 256000,
      format: 'mp3',
    },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  // 约定返回：{ data: { audio: "hex..." }, ... }
  const hex = json?.data?.audio || json?.audio;
  if (!hex) {
    throw new Error(`返回里找不到 audio 字段：${JSON.stringify(json).slice(0, 300)}`);
  }
  return Buffer.from(hex, 'hex');
}

/* ============== 主流程 ============== */
async function main() {
  const args = parseArgs();
  const apiKey = await loadApiKey();
  await mkdir(OUT_DIR, { recursive: true });

  const targets = TRACKS.filter((t) => !args.only || args.only.includes(t.id));
  console.log(`▶ 将生成 ${targets.length} 段 BGM → ${OUT_DIR}\n`);

  let ok = 0, skip = 0, fail = 0;
  for (const track of targets) {
    const outPath = resolve(OUT_DIR, track.file);
    if (!args.force && (await exists(outPath))) {
      console.log(`  · ch${track.id}.mp3 已存在，跳过（用 --force 强制重生成）`);
      skip++;
      continue;
    }
    const t0 = Date.now();
    process.stdout.write(`  · 生成 ch${track.id} (${track.prompt.slice(0, 50)}...) ... `);
    try {
      const buf = await generateTrack(apiKey, track);
      await writeFile(outPath, buf);
      const sec = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`✓ ${(buf.length / 1024).toFixed(1)} KB · ${sec}s`);
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      fail++;
    }
  }

  console.log(`\n完成：✓ ${ok} · 跳过 ${skip} · ✗ ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});