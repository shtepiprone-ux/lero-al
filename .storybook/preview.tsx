import type { Preview, Decorator } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

// ── CSS imports ───────────────────────────────────────────────────────────────
// Mantine CSS must appear before globals.css so Tailwind utilities take precedence
// when both are applied. Mantine uses @layer mantine (separate cascade layer from
// Tailwind's @layer base/utilities), so coexistence is clean.
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '../src/app/globals.css';

// ── Mantine theme ─────────────────────────────────────────────────────────────
import { theme as mantineTheme } from '../src/design-system/mantine/theme';

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
// Owner-approved Mantine proof widths (Task 482, 2026-06-24): 275, 320, 390, 480,
// 560, 680, 768, 960, 1024, 1200, 1440, 1920. All available via the Storybook
// toolbar. Mantine pattern stories (Patterns/Mantine/*) use this toolbar for
// responsive proof — they do NOT create separate exported stories per viewport.
// canonical560/680/810/960/1200 cover design-system.md §3 canonical widths.
const VIEWPORTS = {
  mobile275: { name: '275px',           styles: { width: '275px',  height: '812px' } },
  mobile320: { name: '320px',           styles: { width: '320px',  height: '812px' } },
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

// ── Mantine decorator ─────────────────────────────────────────────────────────
// Wraps ALL stories in MantineProvider (global — pure context, no visual impact
// on legacy stories). Enables Mantine components and theming globally.
//
// Light-only: the app uses a single Light theme (owner requirement, Task 482).
// forceColorScheme="light" ensures Mantine always renders the Light palette,
// regardless of system preference or the legacy theme toolbar value.
// The theme toolbar remains for legacy Tailwind stories (withTheme decorator);
// it does NOT enable Mantine dark-mode rendering.
//
// ModalsProvider: includes the Mantine modal manager stack.
// Notifications: renders the notification portal for NotificationPattern stories.
//
// Mantine-native proof layer for Patterns/Mantine/* stories:
// - Responsive proof via Storybook toolbar viewport selector (not per-story exports)
// - Locale proof via Storybook toolbar locale selector (not per-locale exports)
// - Theme is always Light (no Dark story exports)
// Legacy stories (non-Mantine) are unaffected by this provider.
const withMantine: Decorator = (Story) => {
  return (
    <MantineProvider
      theme={mantineTheme}
      forceColorScheme="light"
    >
      <ModalsProvider>
        <Notifications position="top-right" />
        <Story />
      </ModalsProvider>
    </MantineProvider>
  );
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
// Wraps every LEGACY story in the canonical .container-wide page-gutter so that
// max-sm:w-full controls fill the <640 viewport edge-to-edge (minus the real
// app gutter) rather than being centred/shrink-wrapped by Storybook.
//
// Mantine pattern stories (Patterns/Mantine/*) set parameters.skipCanvas=true to
// bypass this wrapper and use Mantine-native layout containers instead.
// This means Mantine stories are NOT proven through .container-wide — they use
// Mantine's own Box/Container/AppShell as their responsive proof layer.
//
// Horizontal gutter token: .container-wide from globals.css —
//   padding: 1rem (base) → 1.5rem (≥640) → 2rem (≥1024) → 3rem (≥1536).
// Vertical padding token: py-6 (1.5rem / 24px, design-system.md §5 4px scale) —
//   provides canonical separation between the Storybook toolbar and story content.
// This MUST match the canonical container-wide definition in design-system.md §4.
// Do NOT substitute ad-hoc px values or Storybook's built-in padded layout.
// Do NOT add per-story wrapper py-* — the canvas provides the canonical value.
const withCanvas: Decorator = (Story, context) => {
  if (context.parameters.skipCanvas) {
    // Mantine stories bypass withCanvas and use Mantine-native containers.
    return <Story />;
  }
  return (
    <div className="container-wide py-6">
      <Story />
    </div>
  );
};

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
        { value: 'en', title: 'GB English' },
        { value: 'uk', title: 'UA Ukrainian' },
        { value: 'sq', title: 'SQ Albanian' },
        { value: 'it', title: 'IT Italian' },
      ],
      dynamicTitle: true,
    },
  },
  theme: {
    name: 'Theme (legacy Tailwind only)',
    description: 'Light/Dark CSS class for legacy Tailwind stories. Does NOT affect Mantine stories — Mantine is always Light (forceColorScheme="light").',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'light', title: '☀️ Light (Tailwind legacy)' },
        { value: 'dark',  title: '🌙 Dark (Tailwind legacy only — not Mantine)' },
      ],
      dynamicTitle: true,
    },
  },
};

// ── Global decorators ─────────────────────────────────────────────────────────
// Order (outermost → innermost): withTheme → withMantine → withLocale → withCanvas → Story
// withMantine is after withTheme so forceColorScheme receives the correct theme value.
// withCanvas is innermost so the canonical gutter is applied directly around the story
// (or skipped for Mantine stories via parameters.skipCanvas=true).
export const decorators: Decorator[] = [withTheme, withMantine, withLocale, withCanvas];

// ── Preview config ────────────────────────────────────────────────────────────
const preview: Preview = {
  parameters: {
    viewport: {
      options: VIEWPORTS
    },
    // fullscreen: withCanvas decorator provides the canonical container-wide gutter.
    // layout:'centered' and layout:'padded' are FORBIDDEN in story files (lint gate §14.1).
    layout: 'fullscreen',
    backgrounds: {
      options: {
        light: { name: 'light', value: '#fafafa' },
        dark: { name: 'dark',  value: '#232323' },
        muted: { name: 'muted', value: '#f5f5f5' }
      }
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Accessibility — will be used when @storybook/addon-a11y is added in Phase 5
    a11y: { disable: true },
    // Enable App Router context globally so stories using next/navigation hooks
    // (useRouter, usePathname, useSearchParams) do not throw
    // "invariant expected app router to be mounted".
    // @storybook/nextjs-vite mounts AppRouterProvider when appDirectory: true.
    nextjs: {
      appDirectory: true,
    },
  },

  initialGlobals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    },

    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
