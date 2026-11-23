// Storybook/Vite resolution stub for `next-cloudinary` (Task 957 Revision 2, R2-5).
//
// The only Storybook consumer is `ImageUpload` (`CldUploadWidget`). The real widget loads Cloudinary's script (`https://upload-widget.cloudinary.com/global/all.js`) when it mounts and builds its frame
// from it; no Story ever opens the widget (it needs the signature route and a real account), but the frame it builds took the focus away from an open picker in the rendered state census
// (`focus-trap`, `dismiss-escape`, `focus-open` in 1-4 of 64 cells of whichever listing-form Story the script happened to finish loading in, reproduced on the built Storybook), so a census over
// the listing form depended on network timing. This stub renders the widget's children with an `open` that does nothing, loads no script and makes no network call. The widget's own contract
// (the options it is given, `prepareUploadParams`, `onSuccess`) is proven against a double in `ImageUpload.test.tsx` and against the real library in `ImageUpload.widgetOptions.test.tsx`.
// It never reaches the Next.js build (`next build` does not read `.storybook/`).
import type { ReactNode } from 'react'

export interface CloudinaryUploadWidgetResults {
  event: string
  info?: unknown
}

interface CldUploadWidgetProps {
  children?: (api: { open: () => void }) => ReactNode
  [prop: string]: unknown
}

export function CldUploadWidget({ children }: CldUploadWidgetProps) {
  return children ? children({ open: () => {} }) : null
}
