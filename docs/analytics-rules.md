## Recently Viewed Listings — Guest Storage Decision (Task 138 / Epic G.1)

**Decision: cookie, NOT localStorage.**

Rationale: a cookie is included in every HTTP request, so the server component for G.2
("Recently viewed" section) can read it SSR-first without any client-side hydration step —
eliminating the flicker that localStorage would cause.

Implementation contract:
- Cookie name: `rv_listings`
- Format: JSON array of listing UUIDs (`string[]`), e.g. `["uuid1","uuid2",…]`
- Cap: 25 entries (same as auth server-side cap). New entries go to the front; deduplication
  moves an already-present listing to the front. Entries beyond position 25 are pruned.
- Size bound: 25 × 36 chars (UUID) + JSON delimiters ≈ 950 bytes — well within 4 KB limit.
- Attributes: `path=/; max-age=2592000; sameSite=lax; httpOnly=false`
  (`httpOnly: false` so the G.2 client path can also update it without a round-trip.)
- No PII: only listing UUIDs are stored. No user IDs, prices, or listing content.

---

## Business Analytics Rules

### Event Tracking (prepare for future analytics)
- Add `data-track` attributes to all key interactive elements.
- Key events to track: `listing_view`, `listing_click`, `contact_owner`, `whatsapp_click`, `add_favorite`, `remove_favorite`, `search`, `filter_apply`, `register`, `login`, `listing_create`, `listing_edit`, `photo_gallery_open`.
- Track listing views in `listing_views` table (already in schema).
- Track search queries for the future `popular searches` feature.
- Prepare for analytics provider integration through a centralized tracking layer; keep provider-specific implementation outside UI components.

### SEO
- Every page must have unique title and description via Next.js metadata API.
- Title format: `{listing title} — {city} | Lero.al`.
- Listings must use slug-based URLs: `/sq/listings/apartament-2-dhoma-tirane`.
- Use Next.js `generateMetadata()` for dynamic pages.
- Structured data (JSON-LD) for listing pages (RealEstateListing schema).
- Sitemap must be auto-generated for all active listings and locations.
- Images must have descriptive filenames before upload to Cloudinary.
- Canonical URLs must be set for all pages.
- Open Graph + Twitter Card meta tags on all pages.
- hreflang tags for all 4 language versions of each page.

### Conversion Optimization
- CTA buttons must be prominent and action-oriented.
- "Contact owner" and "WhatsApp" buttons must be visible without scrolling on listing page.
- Registration flow must be minimal — ask only required fields.
- Show listing count in search results immediately.
- Price must always be the most visible element on listing card.
- Show daily social proof only when reliable data is available, based on unique listing views from `listing_views`.
- Show "Listed X days ago" to create urgency.
- Agent profile must show total listings + rating + response time.