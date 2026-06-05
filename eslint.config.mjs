// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

// ─────────────────────────────────────────────────────────────────────────────
// FLAT CONFIG OVERRIDE WARNING
// ─────────────────────────────────────────────────────────────────────────────
//
// ESLint flat config merges rules by LAST-WINS per rule key. If two config
// objects both apply to the same file and both define `no-restricted-syntax`
// (or `no-restricted-imports`), the SECOND definition silently replaces the
// first — selectors do NOT merge.
//
// Rule: each governance rule key must appear in AT MOST ONE config block per
// applicable file scope. Use shared constants and spread them into a single
// block when multiple concerns share a scope.
//
// See: docs/eslint-debt-taxonomy.md §no-restricted-syntax override bug (Task 68)
// ─────────────────────────────────────────────────────────────────────────────

// ── Story governance — selectors added to story-specific block ────────────────
//
// IMPORTANT: no-restricted-syntax uses LAST-WINS merge in flat config.
// Story files are in src/**/*.stories.tsx AND src/stories/**
// These files also match the general src/**/*.tsx block. We MUST include
// ALL general .tsx selectors in the story-specific block too, or the story
// block will silently drop the general listing-status / image / SSR rules.
//
// Pattern: the story-specific block comes LAST and spreads in the general
// selectors (GENERAL_TSX_SYNTAX) plus its own additional selectors.
//
// Selector groups added for stories (E–H):
//   E. layout:'centered'|'padded' ban
//   F. Raw HTML controls ban (<button>/<input>/<select>/<textarea>)
//   G. /Ukrainian/ export name ban
//   H. Raw user-facing title literals in fixture objects (≥8-char heuristic)

// ── Listing status governance — exception file set ───────────────────────────
//
// Files that operate on non-listing status domains (AuthStatus, TicketStatus,
// UserStatus, HTTP codes, etc.) are excluded from listing status mutation rules.
// NEVER expand this list without an architecture review.
// See docs/governance-enforcement.md §5 for the mutation gateway contract.
const LISTING_STATUS_IGNORES = [
  // Engine — all status strings are canonical here
  "src/modules/listings/domain/**",
  // THE mutation gateway — only permitted DB write for listing.status
  "src/modules/listings/actions/applyListingTransition.ts",
  // Initial listing INSERT — not a status transition, sets bootstrap state
  "src/modules/listings/actions/createListing.ts",
  // Tests — status literals in assertions are intentional
  "src/**/*.test.ts",
  "src/**/*.test.tsx",
  // Non-listing status contexts: AuthStatus, TicketStatus, UserStatus, HTTP codes
  "src/lib/auth/**",
  "src/modules/auth/**",
  "src/app/admin/support/**",
  "src/modules/notifications/**",
  // Cron jobs + presence — write UserStatus (inactive/active), not ListingStatus
  "src/app/api/cron/**",
  "src/app/api/presence/**",
  // Contacts module — writes ContactStatus, not ListingStatus
  "src/modules/contacts/**",
];

// ── Image governance — exception file set ────────────────────────────────────
//
// These files are the only permitted render sites for raw <img> elements.
// All other files must use <AppImage variant="..."> from AppImage.tsx.
const IMAGE_RENDER_EXCEPTIONS = [
  // AppImage.tsx is the canonical image render site — raw <img> is intentional here
  "src/components/ui/AppImage.tsx",
  // GalleryStaticFrame.tsx renders a raw <img> as a Server Component hero for
  // LCP optimization (bypasses 'use client' so Chrome paints before hydration)
  "src/modules/listings/components/GalleryStaticFrame.tsx",
];

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // ── Downgrade no-explicit-any to warning ──────────────────────────────────
  // The codebase predates strict typing enforcement. Errors block CI; warnings
  // surface the debt without halting deployment.
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Utility scripts are Node.js/CommonJS files — not part of the Next.js app.
    "scripts/**",
    // Storybook static build output — minified bundles trigger false-positive lint errors.
    "storybook-static/**",
  ]),
  // ── Import governance ─────────────────────────────────────────────────────
  //
  // Consolidated: next/image ban + non-lucide icon library ban in one block.
  //
  // WHY consolidated: no-restricted-imports is subject to the same flat config
  // last-wins override as no-restricted-syntax. Splitting import restrictions
  // across multiple overlapping blocks silently deactivates earlier ones.
  //
  //   1. next/image — forbidden project-wide (images via Cloudinary / AppImage)
  //   2. Non-lucide icon libraries — only lucide-react is approved
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/image",
              message:
                "next/image is not used in this project. Images are delivered via Cloudinary CDN. " +
                "Use <AppImage variant=\"...\"> from '@/components/ui/AppImage' instead.",
            },
          ],
          patterns: [
            {
              group: ["@heroicons/*"],
              message: "Non-lucide icon library. Use lucide-react only (governance-enforcement.md §4A).",
            },
            {
              group: ["react-icons/*", "react-icons"],
              message: "Non-lucide icon library. Use lucide-react only (governance-enforcement.md §4A).",
            },
            {
              group: ["phosphor-react", "@phosphor-icons/*"],
              message: "Non-lucide icon library. Use lucide-react only (governance-enforcement.md §4A).",
            },
            {
              group: ["feather-icons"],
              message: "Non-lucide icon library. Use lucide-react only (governance-enforcement.md §4A).",
            },
          ],
        },
      ],
    },
  },
  // ── no-restricted-syntax governance — .tsx files ─────────────────────────
  //
  // ALL no-restricted-syntax selectors for .tsx files are consolidated here.
  // Do NOT add no-restricted-syntax to any other block that overlaps src/**/*.tsx.
  //
  // Selector groups:
  //   A. Image infrastructure governance (raw <img>, srcSet, fetchPriority)
  //   B. Listing status mutation governance (Rules 1–3)
  //   C. window.location navigation governance
  //   D. SSR / hydration governance (suppressHydrationWarning)
  {
    files: ["src/**/*.tsx"],
    ignores: [
      // A: Image governance exceptions
      ...IMAGE_RENDER_EXCEPTIONS,
      // B: Listing status governance exceptions (see LISTING_STATUS_IGNORES above)
      ...LISTING_STATUS_IGNORES,
      // D: SSR governance exception — next-themes requires suppressHydrationWarning
      //    on <html> to prevent FOUC during dark/light mode load
      "src/app/layout.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",

        // ── A. Image infrastructure governance ───────────────────────────
        //
        // All images must go through <AppImage variant="..."> from AppImage.tsx.
        // Raw <img>, inline srcSet, and inline fetchPriority are forbidden.
        // Exceptions: IMAGE_RENDER_EXCEPTIONS above.
        //
        // WHY: Raw <img> bypasses Cloudinary transforms, srcset generation, LQIP,
        // performance tier adaptation, and lazy loading strategy.
        {
          selector: "JSXOpeningElement[name.name='img']",
          message:
            "Raw <img> elements are not allowed. " +
            "Use <AppImage variant=\"...\"> from '@/components/ui/AppImage'. " +
            "AppImage handles srcset, LQIP, fetchPriority, and performance-tier adaptation automatically.",
        },
        {
          selector: "JSXAttribute[name.name='srcSet']",
          message:
            "Inline srcSet is not allowed. " +
            "AppImage builds srcset from Cloudinary transforms defined in appImageConfig.ts. " +
            "Use <AppImage variant=\"...\"> instead.",
        },
        {
          selector: "JSXAttribute[name.name='fetchPriority']",
          message:
            "Inline fetchPriority is not allowed outside AppImage. " +
            "AppImage manages fetch priority automatically per performance tier. " +
            "Use the priority prop on <AppImage> instead.",
        },

        // ── B. Listing status mutation governance ─────────────────────────
        //
        // These rules protect the mutation boundary enforced by applyListingTransition().
        // All rules are ERROR level — violations block the build.
        //
        // SINGLE PERMITTED WRITE PATH:
        //   applyListingTransition()         ← action-based (primary)
        //   applyListingTransitionByStatus() ← status-bridge for UI flows
        //   Both in: src/modules/listings/actions/applyListingTransition.ts
        //
        // B1: Direct .status comparison
        //   Use helpers from '@/modules/listings/domain':
        //   isListingVisible()  replaces  status === 'active'
        //   isListingHidden()   replaces  status === 'pending' || 'inactive'
        //   isListingArchived() replaces  status === 'archived'
        //   isListingClosed()   replaces  status === 'sold' || 'rented'
        {
          selector:
            "BinaryExpression[right.type='Literal'][right.value=/^(active|inactive|sold|rented|archived|pending)$/]:matches([operator='==='],[operator='!==']) > MemberExpression.left[property.name='status']",
          message:
            "Direct .status comparison outside the semantic domain. " +
            "Use helpers from '@/modules/listings/domain': " +
            "isListingVisible(), isListingHidden(), isListingArchived(), isListingClosed(). " +
            "Display maps ({ active: 'success', ... }) are unaffected by this rule.",
        },
        // B2: Raw status string literal as object property value
        //   { status: 'active' } → forbidden
        //   { status: variable } → allowed (engine result via transition.nextStatus)
        {
          selector:
            "Property[key.name='status'][value.type='Literal'][value.value=/^(active|inactive|sold|rented|archived|pending)$/]",
          message:
            "Raw status string literal outside the mutation gateway. " +
            "Use resolveTransition(status, action).nextStatus from '@/modules/listings/domain'. " +
            "For status-to-action bridge: getTransitionActionForStatus(from, to).",
        },
        // B3: Status field in any .update() call
        //   .update({ status: ... }) anywhere outside the mutation gateway → forbidden
        {
          selector:
            "CallExpression[callee.property.name='update'] Property[key.name='status']",
          message:
            "Direct status write in .update() outside the mutation gateway. " +
            "Use applyListingTransition() or applyListingTransitionByStatus() " +
            "from '@/modules/listings/actions/applyListingTransition'.",
        },

        // ── C. window.location navigation governance ──────────────────────
        //
        // window.location.href ASSIGNMENT is forbidden — always use router.push.
        // Read-only accesses (.origin, .pathname, .search, .host) are allowed.
        {
          selector:
            "AssignmentExpression[left.type='MemberExpression']" +
            "[left.object.type='MemberExpression']" +
            "[left.object.object.name='window']" +
            "[left.object.property.name='location']" +
            "[left.property.name='href']",
          message:
            "window.location.href assignment is forbidden. Use router.push() from next/navigation. " +
            "See docs/ai-behavior.md — AI Governance Enforcement Rules.",
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression']" +
            "[callee.object.type='MemberExpression']" +
            "[callee.object.object.name='window']" +
            "[callee.object.property.name='location']" +
            "[callee.property.name=/^(replace|assign)$/]",
          message:
            "window.location.replace/assign is forbidden. Use router.push() from next/navigation. " +
            "See docs/ai-behavior.md — AI Governance Enforcement Rules.",
        },

        // ── D. SSR / hydration governance ─────────────────────────────────
        //
        // suppressHydrationWarning masks hydration mismatches instead of fixing them.
        // Exception: app/layout.tsx (in ignores above) — required by next-themes.
        // All other hydration issues must be fixed at the deterministic rendering layer.
        // See: docs/ai-behavior.md §SSR/Hydration Governance Enforcement
        {
          selector: "JSXAttribute[name.name='suppressHydrationWarning']",
          message:
            "suppressHydrationWarning is forbidden. Fix the hydration mismatch at root cause. " +
            "Exception: app/layout.tsx (next-themes). " +
            "See docs/ai-behavior.md — SSR/Hydration Governance Enforcement.",
        },
      ],
    },
  },
  // ── no-restricted-syntax governance — .ts files ──────────────────────────
  //
  // .ts files have no JSX — image governance (A) and SSR governance (D)
  // selectors are unnecessary here. Listing status (B) and window.location (C)
  // apply to server actions, hooks, and utilities.
  {
    files: ["src/**/*.ts"],
    ignores: [...LISTING_STATUS_IGNORES],
    rules: {
      "no-restricted-syntax": [
        "error",

        // ── B. Listing status mutation governance (same rules as .tsx above) ──
        {
          selector:
            "BinaryExpression[right.type='Literal'][right.value=/^(active|inactive|sold|rented|archived|pending)$/]:matches([operator='==='],[operator='!==']) > MemberExpression.left[property.name='status']",
          message:
            "Direct .status comparison outside the semantic domain. " +
            "Use helpers from '@/modules/listings/domain': " +
            "isListingVisible(), isListingHidden(), isListingArchived(), isListingClosed(). " +
            "Display maps ({ active: 'success', ... }) are unaffected by this rule.",
        },
        {
          selector:
            "Property[key.name='status'][value.type='Literal'][value.value=/^(active|inactive|sold|rented|archived|pending)$/]",
          message:
            "Raw status string literal outside the mutation gateway. " +
            "Use resolveTransition(status, action).nextStatus from '@/modules/listings/domain'. " +
            "For status-to-action bridge: getTransitionActionForStatus(from, to).",
        },
        {
          selector:
            "CallExpression[callee.property.name='update'] Property[key.name='status']",
          message:
            "Direct status write in .update() outside the mutation gateway. " +
            "Use applyListingTransition() or applyListingTransitionByStatus() " +
            "from '@/modules/listings/actions/applyListingTransition'.",
        },

        // ── C. window.location navigation governance ─────────────────────
        {
          selector:
            "AssignmentExpression[left.type='MemberExpression']" +
            "[left.object.type='MemberExpression']" +
            "[left.object.object.name='window']" +
            "[left.object.property.name='location']" +
            "[left.property.name='href']",
          message:
            "window.location.href assignment is forbidden. Use router.push() from next/navigation. " +
            "See docs/ai-behavior.md — AI Governance Enforcement Rules.",
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression']" +
            "[callee.object.type='MemberExpression']" +
            "[callee.object.object.name='window']" +
            "[callee.object.property.name='location']" +
            "[callee.property.name=/^(replace|assign)$/]",
          message:
            "window.location.replace/assign is forbidden. Use router.push() from next/navigation. " +
            "See docs/ai-behavior.md — AI Governance Enforcement Rules.",
        },
      ],
    },
  },
  // ── no-restricted-syntax governance — STORY FILES ────────────────────────
  //
  // MUST come LAST so it takes precedence over the general src/**/*.tsx block
  // for story files (flat-config LAST-WINS on same rule key). Includes ALL
  // general .tsx selectors (A–D) PLUS story-specific selectors (E–H) so that
  // story files are not accidentally exempt from the general rules.
  //
  // Scoped to: src/**/*.stories.tsx and src/stories/**
  // (*.stories.tsx are not in scripts/ or storybook-static/, so no extra ignores needed.)
  //
  // Story-specific selector groups:
  //   E. layout:'centered'|'padded' — forbidden (withCanvas + fullscreen is the canon)
  //   F. Raw HTML controls — forbidden (<button>/<input>/<select>/<textarea>)
  //   G. /Ukrainian/ story export names — forbidden (use LocaleStress instead)
  //   H. Raw user-facing title literals (≥8-char English/Latin heuristic) in fixture fields
  {
    files: ["src/**/*.stories.tsx", "src/stories/**/*.ts", "src/stories/**/*.tsx"],
    ignores: [
      ...IMAGE_RENDER_EXCEPTIONS,
      ...LISTING_STATUS_IGNORES,
      "src/app/layout.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",

        // ── A. Image governance (same as general .tsx block) ─────────────
        {
          selector: "JSXOpeningElement[name.name='img']",
          message:
            "Raw <img> elements are not allowed. " +
            "Use <AppImage variant=\"...\"> from '@/components/ui/AppImage'.",
        },
        {
          selector: "JSXAttribute[name.name='srcSet']",
          message: "Inline srcSet is not allowed. Use <AppImage variant=\"...\"> instead.",
        },
        {
          selector: "JSXAttribute[name.name='fetchPriority']",
          message: "Inline fetchPriority is not allowed outside AppImage.",
        },

        // ── B. Listing status governance (same as general .tsx block) ────
        {
          selector:
            "BinaryExpression[right.type='Literal'][right.value=/^(active|inactive|sold|rented|archived|pending)$/]:matches([operator='==='],[operator='!==']) > MemberExpression.left[property.name='status']",
          message:
            "Direct .status comparison outside the semantic domain. " +
            "Use helpers from '@/modules/listings/domain'.",
        },
        {
          selector:
            "Property[key.name='status'][value.type='Literal'][value.value=/^(active|inactive|sold|rented|archived|pending)$/]",
          message:
            "Raw status string literal outside the mutation gateway. " +
            "Use resolveTransition(status, action).nextStatus.",
        },
        {
          selector: "CallExpression[callee.property.name='update'] Property[key.name='status']",
          message: "Direct status write in .update() outside the mutation gateway.",
        },

        // ── C. window.location governance (same as general .tsx block) ───
        {
          selector:
            "AssignmentExpression[left.type='MemberExpression']" +
            "[left.object.type='MemberExpression'][left.object.object.name='window']" +
            "[left.object.property.name='location'][left.property.name='href']",
          message: "window.location.href assignment is forbidden. Use router.push().",
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.type='MemberExpression']" +
            "[callee.object.object.name='window'][callee.object.property.name='location']" +
            "[callee.property.name=/^(replace|assign)$/]",
          message: "window.location.replace/assign is forbidden. Use router.push().",
        },

        // ── D. SSR / hydration governance (same as general .tsx block) ───
        {
          selector: "JSXAttribute[name.name='suppressHydrationWarning']",
          message: "suppressHydrationWarning is forbidden. Fix the hydration mismatch at root cause.",
        },

        // ── E. Story layout governance ───────────────────────────────────
        //
        // The withCanvas global decorator + layout:'fullscreen' is the canon.
        // layout:'centered' caused the Sprint 32 regression where correct
        // max-sm:w-full primitives appeared non-full-width (root cause §14.1).
        {
          selector: "Property[key.name='layout'][value.value='centered']",
          message:
            "layout:'centered' is FORBIDDEN in stories (docs/storybook-governance.md §14.1). " +
            "The withCanvas global decorator + layout:'fullscreen' is the canon. " +
            "If a story seems to need centered preview, STOP&ASK — do not add an exemption.",
        },
        {
          selector: "Property[key.name='layout'][value.value='padded']",
          message:
            "layout:'padded' is FORBIDDEN in stories (docs/storybook-governance.md §14.1). " +
            "The withCanvas decorator provides the canonical container-wide gutter. " +
            "Storybook's built-in padded layout is not used in this project.",
        },

        // ── F. Raw HTML controls ban ─────────────────────────────────────
        //
        // Stories must use canonical shadcn/ui components (Button, Input, Select, etc.)
        // not raw HTML elements. Raw elements bypass the design system and hide
        // mobile-safety / a11y concerns that the canonical components handle.
        {
          selector: "JSXOpeningElement[name.name='button']",
          message:
            "Raw <button> in stories is FORBIDDEN (docs/storybook-governance.md §9/§14). " +
            "Use the canonical Button from '@/components/ui/button'.",
        },
        {
          selector: "JSXOpeningElement[name.name='input']",
          message:
            "Raw <input> in stories is FORBIDDEN (docs/storybook-governance.md §9/§14). " +
            "Use the canonical Input from '@/components/ui/input'.",
        },
        {
          selector: "JSXOpeningElement[name.name='select']",
          message:
            "Raw <select> in stories is FORBIDDEN (docs/storybook-governance.md §9/§14). " +
            "Use Select from '@/components/ui/select'.",
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message:
            "Raw <textarea> in stories is FORBIDDEN (docs/storybook-governance.md §9/§14). " +
            "Use a canonical form component.",
        },

        // ── G. /Ukrainian/ export name ban ───────────────────────────────
        //
        // Story exports named 'Ukrainian*' duplicate locale concerns — the locale
        // toolbar handles all locales. Rename to 'LocaleStress' (§13/§14).
        {
          selector:
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/Ukrainian/]",
          message:
            "Story exports named '*Ukrainian*' are FORBIDDEN (docs/storybook-governance.md §13/§14). " +
            "Rename to 'LocaleStress' — the locale toolbar handles all locales including Ukrainian.",
        },

        // ── H. Raw user-facing title literals in fixture/story objects ───
        //
        // title: 'Modern Apartment in Tirana Center' → use storyT(locale, 'storybook.KEY')
        // Heuristic: string literal with ≥8 chars that starts with a capital letter
        // and contains only letters/spaces (looks like a real user-facing title).
        // Allowlist: Storybook meta titles (contain '/'), slugs (contain '-'/'_'), short IDs.
        // Developer prose in docs.description is exempt (key name 'description' not targeted).
        {
          selector:
            "Property[key.name='title']" +
            "[value.type='Literal']" +
            "[value.value=/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜ][A-Za-zÀ-ÖØ-öø-ÿ\\s]{7,}$/]",
          message:
            "Raw user-facing title literal in story/fixture (docs/storybook-governance.md §14.2). " +
            "Use storyT(locale, 'storybook.KEY') from '@/stories/_storyI18n'. " +
            "Dev-only prose (Storybook meta title 'Category/Name', slugs, short IDs) is exempt.",
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"]
]);

export default eslintConfig;
