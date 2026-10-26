import { createContext, useContext, useLayoutEffect, type ReactNode } from 'react';
import { Globe } from '@phosphor-icons/react';
import { Select } from './Select';
import { isPublicLocale, publicLanguages, translatePublic, type PublicLocale } from '../i18n/public-locale';
import { useLocale, setLocale, getLocale } from '../i18n';
import type { PublicMessage } from '../i18n/public-messages';

interface LocaleContext {
  locale: PublicLocale;
  changeLocale: (locale: PublicLocale) => void;
  t: (message: PublicMessage, values?: Record<string, string>) => string;
}
const Context = createContext<LocaleContext | null>(null);
const description: PublicMessage = 'Turn local videos into a private streaming-style library. Browse and play in your browser without uploading your files.';
const softwareDescription: PublicMessage = 'A private, local-first video library with search, favorites, watch progress, queues, and a Shorts feed.';

export function PublicLocaleProvider({ children, page }: { children: ReactNode; page: 'landing' | 'setup' }) {
  const locale = useLocale();
  const changeLocale = (value: PublicLocale) => {
    void setLocale(value).catch(() => {});
  };
  useLayoutEffect(() => {
    const t = (message: PublicMessage) => translatePublic(locale, message);
    document.documentElement.lang = locale;
    const canonical = 'https://virelo.riyo.me/' + (page === 'setup' ? 'setup' : '');
    const summary = t(page === 'setup'
      ? 'Start Virelo from a video folder, keep it on a predictable local address, or make it available to devices on your trusted network.' : description);
    const saved: Array<[Element, string, string | null]> = [];
    const update = (selector: string, attribute: string, value: string) => {
      const node = document.querySelector(selector); if (!node) return;
      saved.push([node, attribute, node.getAttribute(attribute)]); node.setAttribute(attribute, value);
    };
    update('link[rel="canonical"]', 'href', canonical);
    for (const selector of ['meta[property="og:url"]', 'meta[name="twitter:url"]']) update(selector, 'content', canonical);
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) update(selector, 'content', summary);
    for (const selector of ['meta[property="og:image:alt"]', 'meta[name="twitter:image:alt"]']) update(selector, 'content', t('Virelo logo'));
    update('meta[property="og:locale"]', 'content', publicLanguages.find(language => language.value === locale)!.og);
    const schema = document.querySelector('script[type="application/ld+json"]');
    const originalSchema = schema?.textContent;
    if (schema && originalSchema) {
      try {
        const graph = JSON.parse(originalSchema);
        graph['@graph'] = graph['@graph'].filter((entity: { '@type': string }) => page === 'landing' || entity['@type'] !== 'FAQPage');
        for (const entity of graph['@graph']) {
          if (entity['@type'] === 'WebSite') { entity.inLanguage = locale; entity.description = t(description); }
          if (entity['@type'] === 'SoftwareApplication') entity.description = t(softwareDescription);
          if (entity['@type'] === 'FAQPage') {
            entity.inLanguage = locale;
            entity.mainEntity = Array.from(document.querySelectorAll('.landing-faq details')).map(details => ({
              '@type': 'Question', name: details.querySelector('summary')?.textContent,
              acceptedAnswer: { '@type': 'Answer', text: details.querySelector('p')?.textContent }
            }));
          }
        }
        graph['@graph'].push({ '@type': 'WebPage', '@id': canonical + '#page', url: canonical, inLanguage: locale,
          name: page === 'setup' ? t('Setup guide') : 'Virelo', description: summary });
        schema.textContent = JSON.stringify(graph);
      } catch { /* Invalid optional metadata must never prevent the page from rendering. */ }
    }
    return () => {
      document.documentElement.lang = getLocale();
      for (const [node, attribute, value] of saved) { if (value === null) node.removeAttribute(attribute); else node.setAttribute(attribute, value); }
      if (schema && originalSchema) schema.textContent = originalSchema;
    };
  }, [locale, page]);
  return <Context.Provider value={{ locale, changeLocale, t: (message, values) => translatePublic(locale, message, values) }}>{children}</Context.Provider>;
}

export function usePublicLocale() {
  const context = useContext(Context);
  if (!context) throw new Error('Public locale requires PublicLocaleProvider.');
  return context;
}

const options = publicLanguages.map(({ value, label }) => ({ value, label }));
export function PublicLanguageSelect() {
  const { locale, changeLocale, t } = usePublicLocale();
  return <div className="public-language-select">
    <Globe aria-hidden="true" />
    <Select value={locale} options={options} align="end" className="public-language-picker"
      label={t('Language') + ': ' + publicLanguages.find(language => language.value === locale)!.label}
      onChange={value => { if (isPublicLocale(value)) changeLocale(value); }} />
  </div>;
}
