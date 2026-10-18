import { DevSettings, I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import * as Updates from 'expo-updates';
import { ar, type Dict } from './ar';
import { en } from './en';
import type { Lang } from '@/lib/types';
import { useAppStore } from '@/lib/store';

const dicts: Record<Lang, Dict> = { ar, en };

export function deviceLanguage(): Lang {
  return Localization.getLocales()[0]?.languageCode === 'en' ? 'en' : 'ar';
}

export function currentLang(): Lang {
  return useAppStore.getState().profile?.language ?? useAppStore.getState().preferredLanguage ?? deviceLanguage();
}

function lookup(dict: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), dict);
}

export function translate(lang: Lang, key: string, params?: Record<string, string | number>) {
  const value = lookup(dicts[lang], key) ?? lookup(ar, key);
  if (typeof value !== 'string') return key;
  return params ? value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? '')) : value;
}

export function t(key: string, params?: Record<string, string | number>) {
  return translate(currentLang(), key, params);
}

/** Hook version: re-renders when the language changes. */
export function useT() {
  const lang = useAppStore((s) => s.profile?.language ?? s.preferredLanguage ?? deviceLanguage());
  return {
    lang,
    dict: dicts[lang],
    t: (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
  };
}

/**
 * Applies the layout direction for `lang`. React Native only picks up an RTL
 * change after a reload, so we reload when the direction actually changes.
 */
export async function applyDirection(lang: Lang) {
  const rtl = lang === 'ar';
  I18nManager.allowRTL(rtl);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.forceRTL(rtl);
    try {
      await Updates.reloadAsync();
    } catch {
      if (__DEV__) DevSettings.reload();
    }
  }
}
