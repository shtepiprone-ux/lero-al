/**
 * What the listing photo widget needs to be built (Task 957, Revision 1, R1-1; Review 1 F1).
 *
 * `next-cloudinary` builds the widget when its script loads, before any signature is asked for, and `getUploadWidgetOptions` throws without a cloud name and, for a signed
 * upload, without an API key (`node_modules/@cloudinary-util/url-loader/dist/index.js:1590-1602`). The page reads both on the server and hands them down as a prop, so the
 * form needs no public upload preset and a Story needs no environment: it passes fixture values. Neither value is the API secret: the cloud name is a `NEXT_PUBLIC_`
 * variable and the signature route already answers the browser with the API key (`ImageUpload.tsx` `SignedUpload.apiKey`); the secret stays on the server
 * (`upload-signature/route.ts`). An unset variable gives '' and the form offers no upload.
 */
export interface CloudinaryWidgetConfig {
  /** `CLOUDINARY_API_KEY` (the key, never the secret). */
  apiKey: string
  /** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. */
  cloudName: string
}

export function getCloudinaryWidgetConfig(env: Record<string, string | undefined> = process.env): CloudinaryWidgetConfig {
  return { apiKey: env.CLOUDINARY_API_KEY ?? '', cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '' }
}

/** The widget can be built only when both values are present. */
export function canBuildUploadWidget(config: CloudinaryWidgetConfig): boolean {
  return config.apiKey !== '' && config.cloudName !== ''
}
