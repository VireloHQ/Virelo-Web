import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');

test('the React root is empty before JavaScript starts', () => {
  assert.match(html, /<div id="root">\s*<\/div>/);
});

test('static landing content is only available when JavaScript is disabled', () => {
  const fallback = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1];
  assert.ok(fallback);
  assert.match(fallback, /<main class="static-shell">/);
  assert.match(fallback, /Your collection\./);
  assert.match(fallback, /npx virelo/);
  assert.match(fallback, /files stay on your device/);
  assert.doesNotMatch(html.replace(/<noscript>[\s\S]*?<\/noscript>/g, ''), /<main class="static-shell">/);
});

test('critical startup styling provides a dark background without an external stylesheet', () => {
  assert.match(html, /html,body\{margin:0;background:var\(--page,#090909\);color:var\(--text,#f5f5f5\)\}/);
});
