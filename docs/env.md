## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset  # Unsigned upload preset for listing images (CldUploadWidget in ImageUpload.tsx). Create in Cloudinary Dashboard → Settings → Upload → Upload presets. Set folder restriction to listings/ (updated to <userId>/listings/ in H.4).
RESEND_API_KEY=re_xxx                  # Resend dashboard → API Keys (server-only, never expose to client)
NEXT_PUBLIC_SITE_URL=https://lero.al
SUPABASE_EMAIL_HOOK_SECRET=v1,whsec_your_base64_secret  # Supabase Dashboard → Auth → Hooks → Send Email Hook → Secret. Dashboard-issued value in v1,whsec_<base64> format (do NOT invent your own). Server-only; verified via Standard Webhooks (standardwebhooks lib) on incoming hook requests at /api/auth-email-hook
CRON_SECRET=your_cron_secret               # Random secret (e.g. openssl rand -hex 32). Set in Vercel → Settings → Environment Variables. Vercel automatically passes it as Authorization: Bearer <CRON_SECRET> to cron routes defined in vercel.json. Used by /api/cron/inactivity.
# Email-change token expiry: 24 hours (hardcoded in src/modules/cabinet/actions/index.ts EMAIL_CHANGE_EXPIRY_HOURS)
# Email preview server: npm run email — launches react-email preview at localhost:3000 (dev only)

# Optional — enables verbose Web Vitals console output in production/staging builds
# NEXT_PUBLIC_PERF_DEBUG=true
```
For deployed environments, these variables must also be configured in Cloudflare Pages → Settings → Variables and Secrets.
Use placeholder values in documentation only; real secrets must be stored in the root `.env.local` file for local development and in Cloudflare Pages environment variables / secrets for deployed environments, never committed to the repository.
Note: Variables starting with `NEXT_PUBLIC_` are exposed to the client bundle and must only be used for values intended to be public. All other variables are server-only and must never be exposed to client code.