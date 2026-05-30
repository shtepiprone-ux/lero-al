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
]);

export default eslintConfig;
