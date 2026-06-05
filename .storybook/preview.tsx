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
// Covers all project breakpoints: 320px → ultrawide.
// canonical560/680/810/960/1200 are the 5 design-system.md §3 canonical widths
// that have no Tailwind breakpoint of their own but are required for the 14-width
// QA canon. Added in Task 350-Fix (DS-5 corrective).
const VIEWPORTS = {
  mobile320: { name: 'Mobile 320px',    styles: { width: '320px',  height: '812px' } },
  mobile360: { name: 'Mobile 360px',    styles: { width: '360px',  height: '800px' } },
  mobile375: { name: 'Mobile 375px',    styles: { width: '375px',  height: '812px' } },
  mobile390: { name: 'Mobile 390px',    styles: { width: '390px',  height: '844px' } },
  mobile412: { name: 'Mobile 412px',    styles: { width: '412px',  height: '915px' } },
  mobile480: { name: 'Mobile 480px',    styles: { width: '480px',  height: '900px' } },
  canonical560: { name: 'Canonical 560px',  styles: { width: '560px',  height: '812px' } },
  tablet640: { name: 'Tablet 640px',    styles: { width: '640px',  height: '960px' } },
  canonical680: { name: 'Canonical 680px',  styles: { width: '680px',  height: '812px' } },
  tablet768: { name: 'Tablet 768px',    styles: { width: '768px',  height: '1024px' } },
  canonical810: { name: 'Canonical 810px',  styles: { width: '810px',  height: '812px' } },
  canonical960: { name: 'Canonical 960px',  styles: { width: '960px',  height: '812px' } },
  desktop1024:  { name: 'Desktop 1024px',     styles: { width: '1024px', height: '768px'  } },
  canonical1200: { name: 'Canonical 1200px', styles: { width: '1200px', height: '812px' } },
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

// ── Canvas decorator ──────────────────────────────────────────────────────────
// Wraps every story in the canonical .container-wide page-gutter so that
// max-sm:w-full controls fill the <640 viewport edge-to-edge (minus the real
// app gutter) rather than being centred/shrink-wrapped by Storybook.
//
// Horizontal gutter token: .container-wide from globals.css —
//   padding: 1rem (base) → 1.5rem (≥640) → 2rem (≥1024) → 3rem (≥1536).
// Vertical padding token: py-6 (1.5rem / 24px, design-system.md §5 4px scale) —
//   provides canonical separation between the Storybook toolbar and story content.
// This MUST match the canonical container-wide definition in design-system.md §4.
// Do NOT substitute ad-hoc px values or Storybook's built-in padded layout.
// Do NOT add per-story wrapper py-* — the canvas provides the canonical value.
const withCanvas: Decorator = (Story) => (
  <div className="container-wide py-6">
    <Story />
  </div>
);

// ── Theme decorator ───────────────────────────────────────────────────────────
// Applies dark/light class to the document root for stories that use semantic tokens.
// Also injects --font-geist-sans so that font-sans / @apply font-sans resolves to the
// CDN-loaded Geist font (preview-head.html). In the real app, this variable is set
// implicitly by Next.js's font loader (geist.className in src/app/layout.tsx). Without
// this injection, any element with an explicit font-family: var(--font-geist-sans) rule
// falls back to the browser default sans-serif instead of Geist.
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    // Mirror what Next.js font loader (geist.className) sets in the real app.
    // 'Geist' is loaded via Google Fonts CDN in .storybook/preview-head.html.
    document.documentElement.style.setProperty('--font-geist-sans', '"Geist", sans-serif');
    document.documentElement.style.setProperty('--font-geist-mono', '"Geist Mono", monospace');
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
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
// Order (outermost → innermost): withTheme → withLocale → withCanvas → Story
// withCanvas is innermost so the canonical gutter is applied directly around the story.
export const decorators: Decorator[] = [withTheme, withLocale, withCanvas];

// ── Preview config ────────────────────────────────────────────────────────────
const preview: Preview = {
  parameters: {
    viewport: {
      viewports: VIEWPORTS,
      defaultViewport: 'desktop1280',
    },
    // fullscreen: withCanvas decorator provides the canonical container-wide gutter.
    // layout:'centered' and layout:'padded' are FORBIDDEN in story files (lint gate §14.1).
    layout: 'fullscreen',
    backgrounds: {
      // Values mirror the lero-al project tokens so the Storybook canvas padding
      // matches the component background (avoids a visible white border halo):
      //   light → --background (--neutral-50 oklch(0.985 0 0) ≈ #FAFAFA)
      //   dark  → --background in .dark (--neutral-0 oklch(0.145 0 0) ≈ #232323)
      //   muted → --muted (--neutral-100 oklch(0.961 0 0) ≈ #F5F5F5)
      default: 'light',
      values: [
        { name: 'light', value: '#fafafa' },
        { name: 'dark',  value: '#232323' },
        { name: 'muted', value: '#f5f5f5' },
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
