// Record the real Shorts UI using verified, CC BY 3.0 Blender film excerpts.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const repo = fileURLToPath(new URL('../', import.meta.url));
const cache = join(repo, 'node_modules/.cache/shorts-blender');
const sourceDirectory = process.env.VIRELO_DEMO_MEDIA_DIR || join(cache, 'sources');
const output = join(repo, 'web/public/landing');
const ffmpeg = process.env.VIRELO_TEST_FFMPEG || 'ffmpeg';
const { chromium } = createRequire(import.meta.url)(process.env.VIRELO_TEST_PLAYWRIGHT || 'playwright');
await mkdir(cache, { recursive: true });
const run = args => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args], { windowsHide: true });
const sources = {
  sintel: '151f543969ebd4643aa0cde14e000d8d0559586f1e9ad693d427cf4179e4c8e2',
  bunny: '9695b70ed5e4ae939b230dd50422ce5aed24bcc49c0e37c02f2e51365c60d1d7'
};
for (const [name, checksum] of Object.entries(sources)) {
  const bytes = await readFile(join(sourceDirectory, name + '.mp4'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), checksum,
    'Use the documented Blender excerpts; see ASSETS.md for sources and checksums.');
}
const scenes = [
  { title: 'Sintel', source: 'sintel', start: 8, framing: 0.35 },
  { title: 'Big Buck Bunny', source: 'bunny', start: 0, framing: 0.5 },
  { title: 'Sintel — Rooftops', source: 'sintel', start: 0, framing: 0.5 }
];
const footage = new Map();
for (const [index, scene] of scenes.entries()) {
  const path = join(cache, `scene-${index + 1}.mp4`);
  run(['-ss', String(scene.start), '-i', join(sourceDirectory, scene.source + '.mp4'), '-t', '10', '-vf',
    `scale=-2:1280,crop=720:1280:(iw-ow)*${scene.framing}:(ih-oh)/2,scale=540:960,fps=24`,
    '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-map_metadata', '-1', '-y', path]);
  footage.set(index + 1, await readFile(path));
}

const server = spawn(process.execPath, [join(repo, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '0'],
  { cwd: repo, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Vite did not start: ' + output)), 20000);
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.stderr.on('data', chunk => { output += chunk; });
    server.stdout.on('data', chunk => {
      output += String(chunk).replace(/\x1b\[[0-9;]*m/g, '');
      const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (url) { clearTimeout(timer); resolve(url); }
    });
  });
  browser = await chromium.launch({ headless: true, executablePath: process.env.VIRELO_TEST_CHROMIUM });
  const context = await browser.newContext({ viewport: { width: 390, height: 820 }, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'block', recordVideo: { dir: cache, size: { width: 390, height: 820 } } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/__shorts-blender/*.mp4', route => {
    const id = Number(new URL(route.request().url()).pathname.match(/(\d+)\.mp4$/)?.[1]);
    const body = footage.get(id);
    assert.ok(body, 'Only the three verified Blender excerpts can be requested');
    const range = route.request().headers().range?.match(/^bytes=(\d+)-(\d*)$/);
    if (!range) return route.fulfill({ body, contentType: 'video/mp4' });
    const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
    return route.fulfill({ status: 206, body: body.subarray(start, end + 1), contentType: 'video/mp4',
      headers: { 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${body.length}` } });
  });
  await page.route(url => url.pathname === '/src/api.ts' && !url.search, async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() +
      "\napi.mediaSource = async id => '/__shorts-blender/' + id + '.mp4';" });
  });
  await page.goto(base + '/app/settings');
  await page.locator('.settings-heading').waitFor();
  await page.locator('.splash-screen').waitFor({ state: 'hidden' });
  await page.evaluate(async scenes => {
    const { saveStoredMedia } = await import('/src/local-library.ts');
    for (const [index, { title }] of scenes.entries()) await saveStoredMedia({
      id: index + 1, library_id: 1, title, sort_title: title, path: `${title}.mp4`, filename: `${title}.mp4`,
      folder: 'Demo', kind: 'movie', duration: 10, width: 540, height: 960, size: 1, mtime: 0,
      added_at: 0, updated_at: 0, liked: 0, progress_position: 0, progress_completed: 0,
      thumbnail_path: null, poster_path: null, backdrop_path: null, year: null,
      series_title: null, season: null, episode: null, overview: null, genres: null
    });
  }, scenes);
  await page.goto(base + '/app/shorts?startId=1');
  await page.locator('.splash-screen').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.querySelector('.short-video')?.readyState >= 2);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await page.locator('.short-video').first().evaluate(async element => {
    element.pause();
    await new Promise(resolve => { element.addEventListener('seeked', resolve, { once: true }); element.currentTime = 7; });
  });
  await page.screenshot({ path: join(cache, 'poster.png') });
  await page.locator('.short-video').first().evaluate(async element => {
    await new Promise(resolve => { element.addEventListener('seeked', resolve, { once: true }); element.currentTime = 0; });
    await element.play();
  });
  const seen = new Set([await page.locator('.short-info h2').textContent()]);
  await page.waitForTimeout(4000); // Deliberate real-time viewing holds for the recording.
  await page.getByRole('button', { name: 'Add to favorites', exact: true }).first().click();
  await page.getByRole('button', { name: 'Remove from favorites', exact: true }).first().waitFor();
  await page.waitForTimeout(1000);
  for (let index = 1; index <= 2; index++) {
    const previous = await page.locator('.short-info h2').textContent();
    await page.locator('.shorts-scroller').evaluate((element, index) => {
      element.scrollTo({ top: element.clientHeight * index, behavior: 'smooth' });
    }, index);
    await page.waitForFunction(previous => document.querySelector('.short-info h2')?.textContent !== previous, previous);
    seen.add(await page.locator('.short-info h2').textContent());
    await page.waitForTimeout(5000);
  }
  assert.deepEqual([...seen].sort(), scenes.map(scene => scene.title).sort(), 'All three clips appear in the swipe recording');
  assert.deepEqual(errors, [], 'The real Shorts screen must not raise runtime errors');
  const recording = page.video();
  await context.close();
  const videoPath = join(output, 'shorts-blender-demo.mp4');
  run(['-sseof', '-15', '-i', await recording.path(), '-t', '15', '-an', '-vf', 'fps=30,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-movflags', '+faststart', '-map_metadata', '-1', '-y', videoPath]);
  run(['-i', join(cache, 'poster.png'), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', '-y', join(output, 'shorts-blender-demo.webp')]);
  const probe = JSON.parse(execFileSync(process.env.VIRELO_TEST_FFPROBE || 'ffprobe',
    ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', videoPath], { encoding: 'utf8', windowsHide: true }));
  assert.equal(probe.streams.length, 1, 'No third-party audio or soundtrack');
  assert.equal(probe.streams[0].codec_name, 'h264');
  assert.equal(probe.streams[0].width, 390);
  assert.equal(probe.streams[0].height, 820);
  assert.ok(Math.abs(Number(probe.format.duration) - 15) < 0.1);
  assert.ok((await stat(videoPath)).size < 25 * 1024 * 1024);
  run(['-i', videoPath, '-f', 'null', '-']);
  console.log('PASS: 15-second Blender Shorts capture, real UI, three verified excerpts, no audio, H.264, full decode.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
