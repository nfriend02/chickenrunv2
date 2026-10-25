import { STRINGS } from './strings.js';

export const LANGS = ['ko', 'en', 'ja'];
const DEFAULT_LANG = 'ko';
const STORAGE_KEY = 'CHICKEN_RUN_LANG';
const LOCALE = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP' };

/**
 * UI language (default Korean). Static markup is translated through data attributes:
 *   data-i18n (text), data-i18n-html, data-i18n-ph (placeholder), data-i18n-title,
 *   data-i18n-aria (aria-label), data-i18n-alt; optional data-i18n-args='{"n":3}'.
 * Code that builds text itself subscribes and re-renders on change.
 */
class I18n {
  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.lang = LANGS.includes(saved) ? saved : DEFAULT_LANG;
    this.listeners = new Set();
  }

  t(key, vars) {
    const entry = STRINGS[key];
    if (!entry) {
      console.warn(`[i18n] missing key: ${key}`);
      return key;
    }
    const text = entry[this.lang] ?? entry[DEFAULT_LANG];
    return vars ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? vars[name] : m)) : text;
  }

  locale() {
    return LOCALE[this.lang];
  }

  set(lang) {
    if (!LANGS.includes(lang) || lang === this.lang) return;
    this.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    this.apply();
    this.listeners.forEach(fn => fn(lang));
  }

  /** ko → en → ja → ko */
  cycle() {
    this.set(LANGS[(LANGS.indexOf(this.lang) + 1) % LANGS.length]);
  }

  /** fn(lang) runs after every language change. */
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  apply(root = document) {
    document.documentElement.lang = this.lang;
    document.title = this.t('app.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', this.t('app.description'));

    const args = (el) => (el.dataset.i18nArgs ? JSON.parse(el.dataset.i18nArgs) : undefined);
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = this.t(el.dataset.i18n, args(el)); });
    root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = this.t(el.dataset.i18nHtml, args(el)); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = this.t(el.dataset.i18nPh); });
    root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = this.t(el.dataset.i18nTitle); });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', this.t(el.dataset.i18nAria)); });
    root.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = this.t(el.dataset.i18nAlt); });
  }
}

export const i18n = new I18n();
export const t = (key, vars) => i18n.t(key, vars);

/** Localized display names for game data, which stays English in GameState / ObstacleDefs. */
export const charText = (ch, field) => t(`char.${ch.id}.${field}`);
export const stageName = (stage) => t(`stage.${stage.id}.name`);
export const obstacleName = (typeKey) => t(`obstacle.${typeKey}`);

window.__I18N__ = i18n;
