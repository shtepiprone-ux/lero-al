// @vitest-environment node
/**
 * Task 957, Revision 1 (R1-1, AC5): the two values the photo widget is built with come from the server environment, never from `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, and an unset
 * variable gives an empty value (the form then offers no upload) instead of "undefined".
 */
import { describe, expect, it } from 'vitest'
import { canBuildUploadWidget, getCloudinaryWidgetConfig } from '../cloudinaryWidgetConfig'

describe('getCloudinaryWidgetConfig', () => {
  it('[AC5] reads the API key and the cloud name', () => {
    expect(getCloudinaryWidgetConfig({ CLOUDINARY_API_KEY: 'key-957', NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'demo-cloud' })).toEqual({ apiKey: 'key-957', cloudName: 'demo-cloud' })
  })

  it('[AC5] hands over neither the API secret, nor the listing preset, nor a public preset, whatever the environment holds', () => {
    const config = getCloudinaryWidgetConfig({
      CLOUDINARY_API_KEY: 'key-957', NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'demo-cloud', CLOUDINARY_API_SECRET: 'secret-957', CLOUDINARY_LISTING_PRESET: 'listing-signed', NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: 'public-preset',
    })
    expect(Object.keys(config).sort()).toEqual(['apiKey', 'cloudName'])
    expect(JSON.stringify(config)).not.toMatch(/secret-957|listing-signed|public-preset/)
  })

  it('[AC5] an unset variable is an empty value, never "undefined"', () => {
    expect(getCloudinaryWidgetConfig({})).toEqual({ apiKey: '', cloudName: '' })
    expect(getCloudinaryWidgetConfig({ CLOUDINARY_API_KEY: 'key-957' })).toEqual({ apiKey: 'key-957', cloudName: '' })
  })

  it('[AC5] reads process.env by default', () => {
    const saved = { key: process.env.CLOUDINARY_API_KEY, cloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }
    process.env.CLOUDINARY_API_KEY = 'key-env'
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'cloud-env'
    try {
      expect(getCloudinaryWidgetConfig()).toEqual({ apiKey: 'key-env', cloudName: 'cloud-env' })
    } finally {
      if (saved.key === undefined) delete process.env.CLOUDINARY_API_KEY; else process.env.CLOUDINARY_API_KEY = saved.key
      if (saved.cloud === undefined) delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; else process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = saved.cloud
    }
  })
})

describe('canBuildUploadWidget', () => {
  it.each([
    [{ apiKey: 'k', cloudName: 'c' }, true],
    [{ apiKey: '', cloudName: 'c' }, false],
    [{ apiKey: 'k', cloudName: '' }, false],
    [{ apiKey: '', cloudName: '' }, false],
  ])('[AC5] %j -> %s', (config, expected) => {
    expect(canBuildUploadWidget(config)).toBe(expected)
  })
})
