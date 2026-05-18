import type { Preview, Decorator } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';

import '../src/app/globals.css';

// ── Locale message fixtures ──────────────────────────────────────────────────
// Import message files for all four supported locales.
// Stories can switch locale via the storybook-i18n toolbar or per-story parameter.
import enMessages from '../messages/en.json';
import sqMessages from '../messages/sq.json';
import ukMessages from '../messages/uk.json';
import itMessages from '../messages/it.json';

const LOCALE_MESSAGES: Record<string, Record<string, unknown>> = {
  en: enMessages,
  sq: sqMessages,
  uk: ukMessages,
  it: itMessages,
};

// ── Viewport presets ─────────────────────────────────────────────────────────
// Covers all project breakpoints: 320px → ultrawide
const VIEWPORTS = {
  mobile320: { name: 'Mobile 320px',    styles: { width: '320px',  height: '812px' } },
  mobile360: { name: 'Mobile 360px',    styles: { width: '360px',  height: '800px' } },
  mobile375: { name: 'Mobile 375px',    styles: { width: '375px',  height: '812px' } },
  mobile390: { name: 'Mobile 390px',    styles: { width: '390px',  height: '844px' } },
  mobile412: { name: 'Mobile 412px',    styles: { width: '412px',  height: '915px' } },
  mobile480: { name: 'Mobile 480px',    styles: { width: '480px',  height: '900px' } },
  tablet640: { name: 'Tablet 640px',    styles: { width: '640px',  height: '960px' } },
  tablet768: { name: 'Tablet 768px',    styles: { width: '768px',  height: '1024px' } },
  desktop1024:  { name: 'Desktop 1024px',     styles: { width: '1024px', height: '768px'  } },
  desktop1280:  { name: 'Desktop 1280px',     styles: { width: '1280px', height: '800px'  } },
  desktop1440:  { name: 'Desktop 1440px',     styles: { width: '1440px', height: '900px'  } },
  desktop1720:  { name: 'Huge Desktop 1720px',styles: { width: '1720px', height: '1080px' } },
  desktop1920:  { name: 'Huge Desktop 1920px',styles: { width: '1920px', height: '1080px' } },
  desktop2560:  { name: 'Huge Desktop 2560px',styles: { width: '2560px', height: '1440px' } },
  ultrawide:    { name: 'Ultrawide 3440px',   styles: { width: '3440px', height: '1440px' } },
};

// ── Locale decorator ─────────────────────────────────────────────────────────
// Wraps all stories in NextIntlClientProvider.
// Locale can be set per-story via: parameters.locale or globalTypes.locale.
const withLocale: Decorator = (Story, context) => {
  const locale = context.globals.locale ?? 'en';
  const messages = LOCALE_MESSAGES[locale] ?? enMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={messages as Record<string, unknown>}>
      <Story />
    </NextIntlClientProvider>
  );
};

// ── Theme decorator ───────────────────────────────────────────────────────────
// Applies dark/light class to the document root for stories that use semantic tokens.
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }
  return (
    <div className={`min-h-screen bg-background text-foreground font-[Geist,sans-serif]`}>
      <Story />
    </div>
  );
};

// ── Global types (toolbar controls) ─────────────────────────────────────────
export const globalTypes = {
  locale: {
    name: 'Locale',
    description: 'i18n locale (sq/en/uk/it)',
    defaultValue: 'en',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'en', title: '🇬🇧 English' },
        { value: 'sq', title: '🇦🇱 Albanian (sq)' },
        { value: 'uk', title: '🇺🇦 Ukrainian (uk) — longest strings' },
        { value: 'it', title: '🇮🇹 Italian (it)' },
      ],
      dynamicTitle: true,
    },
  },
  theme: {
    name: 'Theme',
    description: 'Light / Dark mode',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'light', title: '☀️ Light' },
        { value: 'dark',  title: '🌙 Dark' },
      ],
      dynamicTitle: true,
    },
  },
};

// ── Global decorators ─────────────────────────────────────────────────────────
export const decorators: Decorator[] = [withTheme, withLocale];

// ── Preview config ────────────────────────────────────────────────────────────
const preview: Preview = {
  parameters: {
    viewport: {
      viewports: VIEWPORTS,
      defaultViewport: 'desktop1280',
    },
    layout: 'padded',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark',  value: '#0a0a0a' },
        { name: 'muted', value: '#f4f4f5' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Accessibility — will be used when @storybook/addon-a11y is added in Phase 5
    a11y: { disable: true },
  },
};

export default preview;
