import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const data = source => 'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64');
const messagesUrl = data(await readFile(new URL('../web/src/i18n/public-messages.ts', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../web/src/i18n/public-locale.ts', import.meta.url), 'utf8'))
  .replace("'./public-messages'", JSON.stringify(messagesUrl));
const { resolvePublicLocale: resolve, translatePublic: t, publicLanguages, isPublicLocale } = await import(data(source));
const { publicMessages } = await import(messagesUrl);

test('explicit locale wins, browser language order is respected, and unsupported languages fall back safely', () => {
  assert.equal(resolve('ko', ['ja-JP', 'en-US']), 'ko');
  for (const [languages, expected] of [
    [['ja-JP', 'en'], 'ja'], [['ko-KR'], 'ko'], [['zh-CN'], 'zh-CN'],
    [['zh-SG'], 'zh-CN'], [['zh-Hans-CN'], 'zh-CN'], [['zh'], 'zh-CN'],
    [['zh-Hant', 'ja'], 'ja'], [['zh-TW', 'en'], 'en'], [['fr', 'ko'], 'ko'],
    [['en-GB', 'ja'], 'en'], [[], 'en'], [['fr-FR'], 'en']
  ]) assert.equal(resolve(null, languages), expected);
  for (const bad of [null, false, {}, 'bogus', '<script>', 'ja-JP']) {
    assert.equal(isPublicLocale(bad), false);
    assert.equal(resolve(bad, ['ja']), 'ja');
  }
});

test('every public message has Japanese, Korean and Simplified Chinese with an English source', () => {
  assert.equal(publicLanguages.length, 4);
  assert.ok(Object.keys(publicMessages).length >= 190);
  for (const [message, translations] of Object.entries(publicMessages)) {
    assert.equal(translations.length, 3);
    for (const locale of ['en', 'ja', 'ko', 'zh-CN']) {
      const translated = t(locale, message);
      assert.equal(typeof translated, 'string');
      assert.ok(translated.trim().length > 0, locale + ': ' + message);
    }
    assert.equal(t('en', message), message);
  }
});

test('localized command labels interpolate without translating executable commands', () => {
  assert.equal(t('en', 'Copy {label}', { label: 'npx virelo' }), 'Copy npx virelo');
  assert.equal(t('ja', 'Copy {label}', { label: 'npx virelo' }), 'npx vireloをコピー');
  assert.equal(t('ko', 'Copy {label}', { label: 'npx virelo' }), 'npx virelo 복사');
  assert.equal(t('zh-CN', 'Copy {label}', { label: 'npx virelo' }), '复制npx virelo');
  assert.equal(t('ja', 'Start with') + t('ja', 'a folder.'), '動画フォルダーを選ぶだけ。');
  assert.notEqual(t('ja', 'Start with'), t('ja', 'Start Virelo with'));
});

test('Shorts are named as a video format, not just short-duration videos', async () => {
  assert.equal(t('en', 'Shorts.'), 'Shorts.');
  assert.equal(t('ja', 'Shorts.'), 'ショート動画も、');
  assert.match(t('ko', 'Shorts.'), /쇼츠/);
  assert.match(t('ja', 'Your own feed.'), /スワイプ/);
  assert.equal(Object.hasOwn(publicMessages, 'Short videos.'), false);
  for (const translations of Object.values(publicMessages)) assert.doesNotMatch(translations[0], /短い動画/);
  const landing = await readFile(new URL('../web/src/views/LandingView.tsx', import.meta.url), 'utf8');
  assert.ok(landing.includes('t("Shorts.")'));
});

test('setup explains account creation without claiming the npm server has no authentication', async () => {
  assert.equal(Object.hasOwn(publicMessages, 'Virelo does not include accounts or authentication. Do not expose this address directly to the public internet.'), false);
  const setup = await readFile(new URL('../web/src/views/SetupGuideView.tsx', import.meta.url), 'utf8');
  for (const message of [
    'On first launch in Virelo 0.4+, open localhost on the device running Virelo to create the administrator account. Add other users in Account Manager.',
    'Virelo 0.4+ requires sign-in. Older versions have no authentication. Use a trusted network and never expose Virelo directly to the public internet.'
  ]) {
    assert.ok(setup.includes('t(' + JSON.stringify(message) + ')'));
    for (const locale of ['ja', 'ko', 'zh-CN']) assert.notEqual(t(locale, message), message);
  }
});
