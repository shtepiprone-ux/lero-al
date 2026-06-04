/**
 * Story i18n helper — locale-aware fixture resolver.
 *
 * All user-facing strings in story fixtures MUST come through storyT() or useStoryMessages().
 * Raw string literals in fixture fields are forbidden (docs/storybook-governance.md §14.2).
 *
 * Key path: dot-separated, e.g. 'storybook.listing.modern_apartment'
 * Missing key: throws in dev (no silent English fallback) so omissions are caught immediately.
 */

import enMessages from '../../messages/en.json';
import sqMessages from '../../messages/sq.json';
import ukMessages from '../../messages/uk.json';
import itMessages from '../../messages/it.json';

type MessageObj = Record<string, unknown>;

const MESSAGES: Record<string, MessageObj> = {
  en: enMessages as MessageObj,
  sq: sqMessages as MessageObj,
  uk: ukMessages as MessageObj,
  it: itMessages as MessageObj,
};

function resolveKey(obj: MessageObj, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as MessageObj)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Resolve a storybook.* message key for the given locale.
 * Throws if the locale is unknown or the key is missing (no fallback).
 * This ensures every missing key is caught immediately in development.
 */
export function storyT(locale: string, key: string): string {
  const messages = MESSAGES[locale];
  if (!messages) {
    throw new Error(`storyT: unknown locale "${locale}". Supported: ${Object.keys(MESSAGES).join(', ')}`);
  }
  const value = resolveKey(messages, key);
  if (value === undefined) {
    throw new Error(
      `storyT: missing key "${key}" for locale "${locale}". ` +
      `Add it to messages/${locale}.json under the storybook.* namespace.`
    );
  }
  return value;
}

/**
 * Returns a bound t() function for the given locale.
 * Usage in story render functions:
 *   const t = useStoryMessages(context?.globals?.locale ?? 'en');
 *   return <Component label={t('storybook.listing.modern_apartment')} />;
 */
export function useStoryMessages(locale: string): (key: string) => string {
  return (key: string) => storyT(locale, key);
}
