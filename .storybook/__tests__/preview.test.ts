// Task 967 AC1 — the project preview turns a failed play function into a failed render.
//
// `storybook/test` contributes a core annotation `parameters.throwPlayFunctionExceptions: false`
// (node_modules/storybook/dist/preview/runtime.js, `preview_default3`). With it Storybook catches the play's error,
// logs it and still reports the Story as rendered, so a failing play passes every gate that only renders Stories.
// The project preview is composed after the core and addon annotations, so its parameter wins; this test proves it on
// the composed annotations, the way the build composes them, not by reading the file.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getCoreAnnotations } from 'storybook/internal/csf'
import { composeConfigs } from 'storybook/preview-api'
import * as reactEntryPreview from '@storybook/react/entry-preview'
import * as reactEntryPreviewArgtypes from '@storybook/react/entry-preview-argtypes'
import * as reactEntryPreviewDocs from '@storybook/react/entry-preview-docs'
import * as docsPreview from '@storybook/addon-docs/preview'
import config from '../main'
import projectPreview from '../preview'

type AnnotationModule = Record<string, unknown>

function asModule(entry: unknown): AnnotationModule {
  const resolved = typeof entry === 'function' ? (entry as () => unknown)() : entry
  return resolved as AnnotationModule
}

// The build order: the core annotations (they include the `storybook/test` one), then the renderer, the framework and the
// addons' preview annotations, and the project preview last (`previewAnnotations` of the presets, then `.storybook/preview.tsx`).
// `@storybook/nextjs-vite/preview` imports `sb-original/image-context`, an alias only the Storybook Vite build defines, so it
// cannot be imported under Vitest; the last test proves that package (and every other one in the build) leaves the parameter alone.
function composeBuildAnnotations(withProjectPreview: boolean) {
  const list: AnnotationModule[] = [
    ...(getCoreAnnotations() as AnnotationModule[]),
    asModule(reactEntryPreview),
    asModule(reactEntryPreviewArgtypes),
    asModule(reactEntryPreviewDocs),
    asModule(docsPreview),
  ]
  if (withProjectPreview) list.push(asModule(projectPreview))
  return composeConfigs(list as never)
}

const NODE_MODULES = path.resolve(__dirname, '../../node_modules')

function filesUnder(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(full)
    return entry.name.endsWith('.js') ? [full] : []
  })
}

describe('Storybook project preview', () => {
  it('without the project preview the composed annotations swallow a failed play (the storybook/test annotation is false)', () => {
    expect(composeBuildAnnotations(false).parameters?.throwPlayFunctionExceptions).toBe(false)
  })

  it('composes throwPlayFunctionExceptions to true with the project preview, so a failed play fails the render', () => {
    expect(composeBuildAnnotations(true).parameters?.throwPlayFunctionExceptions).toBe(true)
  })

  it('leaves the parameter to the core: no framework, renderer or addon package of the build sets it, and a new addon is added here', () => {
    expect(config.addons).toEqual(['@storybook/addon-docs'])
    const packages = ['@storybook/nextjs-vite', '@storybook/react', '@storybook/addon-docs']
    const setters = packages.flatMap((name) =>
      filesUnder(path.join(NODE_MODULES, name, 'dist')).filter((file) => fs.readFileSync(file, 'utf8').includes('throwPlayFunctionExceptions')),
    )
    expect(setters).toEqual([])
  })
})
