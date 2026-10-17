import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('public project links and account claims distinguish the web player from the CLI', async () => {
  for (const file of ['web/public/llms.txt', 'web/public/llms-full.txt']) {
    const text = await read(file);
    assert.ok(text.includes('https://github.com/VireloHQ/Virelo-Web'));
    assert.ok(text.includes('https://github.com/VireloHQ/Virelo'));
    assert.doesNotMatch(text, /github\.com\/Riyoway\//i);
    assert.match(text, /0\.4\+ requires sign-in/);
    assert.match(text, /localhost/);
    assert.doesNotMatch(text, /Virelo does not require an account/);
  }
});

test('the shipping demo references only the new project-created media', async () => {
  const component = await read('web/src/components/ShortsDemo.tsx');
  for (const file of ['shorts-original-demo.mp4', 'shorts-original-demo.webp']) {
    assert.ok(component.includes('/landing/' + file));
    const size = (await stat(new URL('../web/public/landing/' + file, import.meta.url))).size;
    assert.ok(size > 1000 && size < 25 * 1024 * 1024, file);
  }
  const assets = await readdir(new URL('../web/public/landing/', import.meta.url));
  for (const retired of ['shorts-demo.mp4', 'shorts-demo-poster.webp', 'shorts-mobile-20261009.mp4', 'shorts-mobile-20261009.webp']) {
    assert.equal(assets.includes(retired), false, retired + ' must not be distributed');
  }
  assert.ok(component.includes('controls={false}'));
  assert.ok(component.includes('onContextMenu={event => event.preventDefault()}'));
  const provenance = await read('ASSETS.md');
  assert.match(provenance, /No downloaded social-media footage/);
});

test('local credentials and hosting metadata stay out of future commits', async () => {
  const ignore = await read('.gitignore');
  for (const entry of ['.env.*', '.npmrc', '*.pem', '*.key', '.vercel/', '.wrangler/', '.codex-remote-attachments/']) {
    assert.ok(ignore.split(/\r?\n/).includes(entry), entry);
  }
});
