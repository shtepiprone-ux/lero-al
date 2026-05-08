## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=re_xxx

# Optional — enables verbose Web Vitals console output in production/staging builds
# NEXT_PUBLIC_PERF_DEBUG=true
```
For deployed environments, these variables must also be configured in Cloudflare Pages → Settings → Variables and Secrets.
Use placeholder values in documentation only; real secrets must be stored in the root `.env.local` file for local development and in Cloudflare Pages environment variables / secrets for deployed environments, never committed to the repository.
Note: Variables starting with `NEXT_PUBLIC_` are exposed to the client bundle and must only be used for values intended to be public. All other variables are server-only and must never be exposed to client code.