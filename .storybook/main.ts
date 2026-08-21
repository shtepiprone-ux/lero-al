// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from '@storybook/nextjs-vite';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  // Story locations: colocated *.stories.tsx + src/stories/
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../src/stories/**/*.stories.@(ts|tsx)',
  ],

  addons: ['@storybook/addon-docs'],

  // Uses @storybook/nextjs-vite (stable, Vite-based).
  // Migrated from @storybook/experimental-nextjs-vite (SB8) as part of Task 394 SB10 upgrade.
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },

  // Resolve @/* path alias (mirrors tsconfig.json paths)
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      '@': path.resolve(__dirname, '../src'),
      // Task 757 (§15.1a) — narrow resolution stubs so the real production AuthSheet.tsx
      // (which statically imports 'use server' action modules) can be bundled by Vite at
      // all. Next.js's own build splits 'use server' files into RSC-only references so their
      // bodies never reach the browser; Vite has no equivalent split. Both stubbed calls
      // (`headers()`, `createHash()`) only ever execute inside a server-action body, never at
      // module init or render time, so no Story can actually invoke them — see
      // .storybook/stubs/*.ts for the full rationale. Exact-specifier aliases only; nothing
      // else resolving 'next/headers' or 'crypto' anywhere else in the module graph is
      // affected beyond these two literal import specifiers.
      'next/headers': path.resolve(__dirname, './stubs/next-headers.ts'),
      'crypto': path.resolve(__dirname, './stubs/crypto.ts'),
    };
    return config;
  },

  // Static dir for public assets
  staticDirs: ['../public'],

  typescript: {
    check: false,
  }
};

export default config;
