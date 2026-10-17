import { createRequire, stripTypeScriptTypes } from 'node:module';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const repo = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = createRequire(process.env.VIRELO_TEST_NODE_PACKAGE || import.meta.url)('playwright');
const source = await readFile(join(repo, 'web/src/i18n/public-messages.ts'), 'utf8');
const { publicMessages } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const languages = [
  { browser: 'en-US', code: 'en', name: 'English', index: -1 },
  { browser: 'ja-JP', code: 'ja', name: '日本語', index: 0 },
  { browser: 'ko-KR', code: 'ko', name: '한국어', index: 1 },
  { browser: 'zh-CN', code: 'zh-CN', name: '简体中文', index: 2 }
];
const text = (locale, message) => locale.index < 0 ? message : publicMessages[message][locale.index];
const screenshots = await mkdtemp(join(tmpdir(), 'virelo-locales-'));
const server = spawn(process.execPath, [join(repo, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '0'],
  { cwd: repo, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let browser, checks = 0, commandBaseline;
const check = (value, label) => { assert.ok(value, label); checks++; };
try {
  const base = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(output)), 20000);
    server.once('error', reject);
    server.stderr.on('data', chunk => { output += chunk; });
    server.stdout.on('data', chunk => {
      output += String(chunk).replace(/\x1b\[[0-9;]*m/g, '');
      const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (url) { clearTimeout(timer); resolve(url); }
    });
  });
  browser = await chromium.launch({ headless: true, executablePath: process.env.VIRELO_TEST_CHROMIUM });
  async function choose(page, locale) {
    await page.locator('.public-language-select .picker-trigger').click();
    await page.getByRole('option', { name: locale.name, exact: true }).click();
    await page.waitForFunction(code => document.documentElement.lang === code, locale.code);
  }
  for (const locale of languages) {
    const context = await browser.newContext({ locale: locale.browser, serviceWorkers: 'block', reducedMotion: 'reduce',
      permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => { errors.push('native dialog: ' + dialog.type()); await dialog.dismiss(); });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width > 760 ? 1000 : 844 });
      for (const path of ['/', '/setup']) {
        await page.goto(base + path);
        await page.locator(path === '/' ? '#landing-title' : '#setup-title').waitFor();
        await page.waitForFunction(code => document.documentElement.lang === code, locale.code);
        await page.evaluate(() => document.fonts.ready);
        check(await page.title() === 'Virelo', locale.code + ' preserves product title');
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), locale.code + ' fits ' + path + ' at ' + width);
        check(await page.locator('h1').count() === 1, locale.code + ' has one heading');
        const action = await page.locator('.landing-header-actions .landing-open-link').boundingBox();
        const selector = await page.locator('.public-language-select').boundingBox();
        check(action.x >= 0 && action.x + action.width <= width + 1 && selector.x >= 0 && selector.x + selector.width <= width + 1,
          locale.code + ' header actions remain in bounds at ' + width);
        check(await page.locator('link[rel="canonical"]').getAttribute('href') === 'https://virelo.riyo.me' + path,
          locale.code + ' canonical follows the public page');
        const graph = await page.locator('script[type="application/ld+json"]').evaluate(node => JSON.parse(node.textContent)['@graph']);
        check(graph.find(entity => entity['@type'] === 'WebPage').inLanguage === locale.code, 'structured page language');
        if (path === '/') {
          check(await page.locator('#landing-title').textContent() === text(locale, 'Your collection.') + text(locale, 'Now showing.'), 'localized headline');
          if (width === 320 || width === 390) {
            await page.locator('.public-language-select .picker-trigger').click();
            const menu = await page.getByRole('listbox').boundingBox();
            check(menu.x >= 0 && menu.x + menu.width <= width, 'language choices fit the mobile viewport');
            if (width === 390) await page.screenshot({ path: join(screenshots, locale.code + '-language-menu.png') });
            await page.keyboard.press('Escape');
          }
          const faq = await page.locator('.landing-faq details').evaluateAll(nodes => nodes.map(node => ({
            name: node.querySelector('summary').textContent, answer: node.querySelector('p').textContent
          })));
          assert.deepEqual(graph.find(entity => entity['@type'] === 'FAQPage').mainEntity.map(entity => ({
            name: entity.name, answer: entity.acceptedAnswer.text
          })), faq);
          checks++;
          const cta = await page.locator('.landing-hero-actions a').first().boundingBox();
          check(cta.y + cta.height <= (width > 760 ? 1000 : 844), locale.code + ' primary action in first screen');
          await page.getByRole('tab', { name: text(locale, 'Library'), exact: true }).focus();
          await page.keyboard.press('ArrowRight');
          check(await page.getByRole('tab', { name: text(locale, 'Player'), exact: true }).getAttribute('aria-selected') === 'true', 'localized keyboard preview');
          await page.getByRole('tab', { name: text(locale, 'Run locally'), exact: true }).click();
          check(await page.locator('.landing-command code').textContent() === 'npx virelo', 'executable command remains unchanged');
          await page.locator('.landing-command button').click();
          check(await page.evaluate(() => navigator.clipboard.readText()) === 'npx virelo', 'localized copy preserves command');
          await page.getByRole('status').filter({ hasText: text(locale, 'Command copied. Open a terminal in your video folder and paste it.') }).waitFor();
          check((await page.locator('.landing-copy-status').textContent()).includes(text(locale, 'Command copied. Open a terminal in your video folder and paste it.')), 'localized copy feedback');
          await page.locator('.landing-shorts-demo').scrollIntoViewIfNeeded();
          check(await page.locator('.landing-shorts-demo video').getAttribute('aria-label') === text(locale, 'Virelo Shorts demonstration'), 'localized demo description');
        } else {
          check(await page.locator('#setup-title').textContent() === text(locale, 'Run Virelo locally.'), 'localized guide title');
          const commands = await page.locator('.setup-page code').allTextContents();
          if (!commandBaseline) commandBaseline = commands;
          assert.deepEqual(commands, commandBaseline);
          checks++;
          check(!graph.some(entity => entity['@type'] === 'FAQPage'), 'guide does not advertise a hidden landing FAQ');
          await page.locator('.setup-command button').first().click();
          check(await page.evaluate(() => navigator.clipboard.readText()) === 'npx virelo', 'localized guide copy');
          await page.getByRole('link', { name: text(locale, 'Network access'), exact: true }).click();
          check(new URL(page.url()).hash === '#network', 'localized guide anchors');
        }
        if (width === 390 || width === 1440) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: join(screenshots, locale.code + (path === '/' ? '-landing-' : '-setup-') + width + '.png'), fullPage: true });
          await page.screenshot({ path: join(screenshots, locale.code + (path === '/' ? '-hero-' : '-guide-hero-') + width + '.png') });
        }
      }
    }
    await page.goto(base);
    await page.locator('#landing-title').waitFor();
    const selected = locale.code === 'ja' ? languages[2] : languages[1];
    await choose(page, selected);
    check(await page.evaluate(() => localStorage.getItem('virelo-public-locale:v1')) === selected.code, 'explicit language saved');
    await page.locator('.landing-nav a[href="/setup"]').click();
    await page.locator('#setup-title').waitFor();
    check(await page.locator('#setup-title').textContent() === text(selected, 'Run Virelo locally.'), 'selection survives client-side guide navigation');
    await page.reload();
    await page.waitForFunction(code => document.documentElement.lang === code, selected.code);
    check(true, 'selection survives reload');
    await page.locator('.landing-header-actions a[href="/app"]').click();
    await page.locator('.app-shell').waitFor();
    check(await page.evaluate(() => document.documentElement.lang) === 'en', 'English app is not mislabeled as translated');
    await page.goto(base);
    await page.waitForFunction(code => document.documentElement.lang === code, selected.code);
    const trigger = page.locator('.public-language-select .picker-trigger');
    await trigger.focus(); await page.keyboard.press('Enter');
    check(await page.getByRole('option').count() === 4, 'custom language menu has four options');
    await page.keyboard.press('End'); await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.documentElement.lang === 'zh-CN');
    check(true, 'language menu supports keyboard selection');
    const second = await context.newPage();
    await second.goto(base + '/setup'); await second.locator('#setup-title').waitFor();
    await choose(page, languages[2]);
    await second.waitForFunction(() => document.documentElement.lang === 'ko');
    check(true, 'language changes synchronize across tabs');
    check(errors.length === 0, locale.code + ' no errors or native dialogs: ' + errors.join(', '));
    console.log('PASS ' + locale.code + ': landing, guide, metadata, responsive layout, copy, persistence and keyboard');
    await context.close();
  }
  const blocked = await browser.newContext({ locale: 'en-US', serviceWorkers: 'block' });
  await blocked.addInitScript(() => {
    for (const method of ['getItem', 'setItem']) Object.defineProperty(Storage.prototype, method, {
      configurable: true, value() { throw new DOMException('Storage blocked', 'SecurityError'); }
    });
  });
  const page = await blocked.newPage(), blockedErrors = [];
  page.on('pageerror', error => blockedErrors.push(error.message));
  await page.goto(base); await page.locator('#landing-title').waitFor();
  await choose(page, languages[1]);
  await page.locator('.landing-nav a[href="/setup"]').click(); await page.locator('#setup-title').waitFor();
  check(await page.locator('#setup-title').textContent() === text(languages[1], 'Run Virelo locally.'), 'blocked storage keeps the session choice');
  check(blockedErrors.length === 0, 'blocked storage does not crash localization');
  await blocked.close();
  console.log(JSON.stringify({ checks, screenshots, result: 'passed' }));
} finally {
  if (browser) await browser.close();
  server.kill();
}
