import { InjectionToken } from '@angular/core';

/**
 * Base path of the file manager connector API implemented by
 * `FileManagerController.scala` (Jakon backend). All file manager HTTP calls
 * are made relative to this path, e.g. `${FILE_MANAGER_API_BASE}/listUrl`.
 *
 * In development this is proxied to the real backend host via `proxy.conf.json`.
 * In production the app is expected to be served from the same origin as the
 * Jakon admin UI, so a relative path works without any extra configuration.
 */
export const FILE_MANAGER_API_BASE = new InjectionToken<string>('FILE_MANAGER_API_BASE', {
  providedIn: 'root',
  factory: () => '/admin/files',
});

/** Supported UI languages, matching the JSON files under `public/i18n/`. */
export const SUPPORTED_LANGUAGES = ['cs', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const LANGUAGE_STORAGE_KEY = 'jakon-filemanager.lang';
