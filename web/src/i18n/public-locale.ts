import { publicMessages, type PublicMessage } from './public-messages';

export const PUBLIC_LOCALE_KEY = 'virelo-public-locale:v1';
export const publicLanguages = [
  { value: 'en', label: 'English', og: 'en_US' },
  { value: 'ja', label: '日本語', og: 'ja_JP' },
  { value: 'ko', label: '한국어', og: 'ko_KR' },
  { value: 'zh-CN', label: '简体中文', og: 'zh_CN' }
] as const;
export type PublicLocale = typeof publicLanguages[number]['value'];

export function isPublicLocale(value: unknown): value is PublicLocale {
  return publicLanguages.some(language => language.value === value);
}

export function resolvePublicLocale(saved: unknown, languages: readonly string[]): PublicLocale {
  if (isPublicLocale(saved)) return saved;
  for (const language of languages) {
    const code = language.toLowerCase();
    if (/^ja(?:-|$)/.test(code)) return 'ja';
    if (/^ko(?:-|$)/.test(code)) return 'ko';
    if (/^en(?:-|$)/.test(code)) return 'en';
    if (/^zh(?:$|-(?:cn|sg|hans)(?:-|$))/.test(code)) return 'zh-CN';
  }
  return 'en';
}

export function translatePublic(locale: PublicLocale, message: PublicMessage, values: Record<string, string> = {}): string {
  const index = locale === 'ja' ? 0 : locale === 'ko' ? 1 : 2;
  const text = locale === 'en' ? message : publicMessages[message][index];
  return text.replace(/\{(\w+)\}/g, (token, key: string) => values[key] ?? token);
}
