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
