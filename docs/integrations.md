## External Service Accounts
The following external service accounts are already registered and available for integration; project-side configuration may still be required.

| Service | URL | Purpose |
|---|---|---|
| Supabase | https://supabase.com | Database + Auth |
| Cloudflare | https://dash.cloudflare.com | Hosting + CDN + DNS |
| Cloudinary | https://cloudinary.com | Photo storage + transformations |
| Resend | https://resend.com | Transactional emails |
| Sentry | https://sentry.io | Error monitoring |
| GitHub | https://github.com | Code repository |

### Cloudinary Setup
- Account is registered at https://cloudinary.com.
- Use Cloudinary for ALL property photo uploads AND user avatar uploads — never Supabase Storage.
- Auto-transformations to set up in Cloudinary:
  - Thumbnail: `w_400,h_300,c_fill,f_webp,q_auto`;
  - Card image: `w_800,h_600,c_fill,f_webp,q_auto`;
  - Full size: `w_1920,f_webp,q_auto`.
- Environment variables needed:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — from Cloudinary dashboard;
  - `CLOUDINARY_API_KEY` — from Cloudinary dashboard (server-only);
  - `CLOUDINARY_API_SECRET` — from Cloudinary dashboard (server-only, never expose to client).

### Cloudinary Avatar Pipeline
- Avatars uploaded via `uploadUserAvatar` (admin) or `uploadCabinetAvatar` (cabinet) Server Actions.
- Server-side signed upload: `POST https://api.cloudinary.com/v1_1/{cloud}/image/upload` with SHA-1 signature.
- Upload folder: `avatars/`.
- Avatar input accepts any dimensions ≥ 256×256 and ≤ 10 MB across JPG/PNG/WEBP. The client crops to 256×256 via canvas; the server validates the cropped result (MIME, size ≤ 2 MB, dimensions = 256×256).
- Client-side validation before crop modal: MIME ∈ {image/jpeg, image/png, image/webp}, source size ≤ 10 MB, source dimensions ≥ 256×256.
- Client crop: user pans/zooms inside a square crop frame; AvatarCropModal (react-easy-crop) renders 256×256 JPEG at q=0.92 via canvas.
- Server-side validation: MIME + size ≤ 2 MB + dimensions = 256×256 via Cloudinary response.
- Stored URL is the raw Cloudinary URL. Display via `<AppImage variant="avatar">` applies `w_192,h_192,c_fill` transform at render time.
- Display via `AppImage` `variant="avatar"` for Cloudinary-first delivery and srcset.
  
### Resend Setup
- Account is registered at https://resend.com .
- Check the current Resend plan limits in the Resend dashboard before relying on quota assumptions.
- Install: `npm install resend`.
- Environment variable needed: `RESEND_API_KEY` — from Resend dashboard (server-only).
- Use Resend for:
  - Email confirmation on registration;
  - Password reset emails;
  - New message notifications;
  - Saved search match notifications;
  - Support ticket replies;
  - Listing expiry warnings;
  - Email-change verification email (new address) — **pending Task 34 integration**;
  - Email-change security notification (old address) — **pending Task 34 integration**.
- Create email templates in `src/modules/notifications/lib/emails/`.
- NEVER call Resend from client-side code — only from server actions or API routes.

**Email-change flow**: `initiateEmailChange` and `resendEmailVerification` call `sendEmailChangeEmails()` from `src/modules/notifications/lib/emails/emailChange.ts`. This sends two emails via Resend: verification email to the new address and security notification to the old address. Requires `RESEND_API_KEY` env var and `noreply@lero.al` verified as a sender in the Resend dashboard. If `RESEND_API_KEY` is absent (e.g. local dev without key), the function logs the verification URL to console and returns silently.