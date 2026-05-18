import type { StorybookConfig } from '@storybook/experimental-nextjs-vite';
import path from 'path';

const config: StorybookConfig = {
  // Story locations: colocated *.stories.tsx + src/stories/
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../src/stories/**/*.stories.@(ts|tsx)',
  ],

  addons: [
    '@storybook/addon-essentials',
  ],

  // Switched from @storybook/nextjs (webpack) to @storybook/experimental-nextjs-vite (Vite)
  // because Next.js 15.5 changed its internal webpack hooks, breaking @storybook/builder-webpack5.
  framework: {
    name: '@storybook/experimental-nextjs-vite',
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

  docs: {
    autodocs: 'tag',
  },

  typescript: {
    check: false,
  },
};

export default config;
