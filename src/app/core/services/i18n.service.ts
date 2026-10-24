import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../config/app-config';

type TranslationDict = Record<string, string>;

const APP_LOCALE_META_SELECTOR = 'meta[name="app-locale"]';

/**
 * Reads the Jakon admin user's configured locale from `<meta name="app-locale">`
 * (rendered server-side by `fileManagerV2Frame.peb` via `{{ locale() }}`), so the
 * app defaults to the same language as the rest of the Jakon admin UI instead of
 * the browser's language or a stale `localStorage` value. Absent when the app is
 * loaded outside of Jakon (e.g. the standalone dev server).
 */
function detectProfileLanguage(): SupportedLanguage | null {
  const locale = document.querySelector(APP_LOCALE_META_SELECTOR)?.getAttribute('content');
  if (locale && (SUPPORTED_LANGUAGES as readonly string[]).includes(locale)) {
    return locale as SupportedLanguage;
  }
  return null;
}

function detectInitialLanguage(): SupportedLanguage {
  const profileLang = detectProfileLanguage();
  if (profileLang) {
    return profileLang;
  }
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
    return stored as SupportedLanguage;
  }
  const browserLang = navigator.language?.slice(0, 2);
  if (browserLang && (SUPPORTED_LANGUAGES as readonly string[]).includes(browserLang)) {
    return browserLang as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Minimal signal-based translation service. Translations are plain JSON files
 * under `public/i18n/<lang>.json`, fetched with a base-href-relative URL
 * (`i18n/<lang>.json`) so it resolves correctly both standalone (served at `/`)
 * and embedded in Jakon (served under `/jakon/filemanager/`). Loaded on demand
 * when the language changes. Kept dependency-free on purpose.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient);

  readonly language = signal<SupportedLanguage>(detectInitialLanguage());
  readonly languages = SUPPORTED_LANGUAGES;

  private readonly dict = signal<TranslationDict>({});

  constructor() {
    effect(() => {
      const lang = this.language();
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      void this.loadLanguage(lang);
    });
  }

  setLanguage(lang: SupportedLanguage): void {
    this.language.set(lang);
  }

  /** Translates `key`, optionally interpolating `{placeholder}` tokens from `params`. */
  translate(key: string, params?: Record<string, string | number>): string {
    const template = this.dict()[key] ?? key;
    if (!params) {
      return template;
    }
    return Object.entries(params).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      template,
    );
  }

  private async loadLanguage(lang: SupportedLanguage): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<TranslationDict>(`i18n/${lang}.json`));
      this.dict.set(data);
    } catch {
      if (lang !== DEFAULT_LANGUAGE) {
        await this.loadLanguage(DEFAULT_LANGUAGE);
      }
    }
  }
}
