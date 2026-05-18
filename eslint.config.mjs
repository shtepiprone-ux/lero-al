import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

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

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Utility scripts are Node.js/CommonJS files — not part of the Next.js app.
    // They use require() legitimately and should not be linted by next/typescript rules.
    "scripts/**",
  ]),

  // ── Image infrastructure enforcement ──────────────────────────────────────
  //
  // next/image must NOT be imported anywhere. Images are delivered via direct
  // Cloudinary URLs using native <img> with srcset inside AppImage.tsx.
  // All code must use <AppImage variant="..."> from '@/components/ui/AppImage'.
  // This prevents regressions: proxy overhead, broken DPR, uncontrolled sizes.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/image',
              message:
                "next/image is not used in this project. Images are delivered via Cloudinary CDN. Use <AppImage variant=\"...\"> from '@/components/ui/AppImage' instead.",
            },
          ],
        },
      ],
    },
  },

  // ── Image infrastructure governance ───────────────────────────────────────
  //
  // All images must go through <AppImage variant="..."> from AppImage.tsx.
  // The raw <img> element, inline srcSet, and inline fetchPriority are forbidden
  // in all files except AppImage.tsx itself (the only permitted render site).
  //
  // WHY:
  //   Raw <img> bypasses: Cloudinary transforms, srcset generation, LQIP,
  //   performance tier adaptation (fetchPriority/preload), lazy loading strategy.
  //   Violations silently degrade LCP, CLS, and bandwidth efficiency.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: [
      // AppImage.tsx is the canonical image render site
      'src/components/ui/AppImage.tsx',
      // GalleryStaticFrame.tsx intentionally renders a raw <img> as a Server Component
      // hero for LCP optimization — bypassing AppImage ('use client') so Chrome can
      // paint the cover image before React hydration completes. Justified exception.
      'src/modules/listings/components/GalleryStaticFrame.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='img']",
          message:
            'Raw <img> elements are not allowed. ' +
            'Use <AppImage variant="..."> from \'@/components/ui/AppImage\'. ' +
            'AppImage handles srcset, LQIP, fetchPriority, and performance-tier adaptation automatically.',
        },
        {
          selector: "JSXAttribute[name.name='srcSet']",
          message:
            'Inline srcSet is not allowed. ' +
            'AppImage builds srcset from Cloudinary transforms defined in appImageConfig.ts. ' +
            'Use <AppImage variant="..."> instead.',
        },
        {
          selector: "JSXAttribute[name.name='fetchPriority']",
          message:
            'Inline fetchPriority is not allowed outside AppImage. ' +
            'AppImage manages fetch priority automatically per performance tier. ' +
            'Use the priority prop on <AppImage> instead.',
        },
      ],
    },
  },

  // ── Listing status mutation governance ─────────────────────────────────────
  //
  // These rules protect the mutation boundary enforced by applyListingTransition().
  // All rules are ERROR level — violations block the build.
  //
  // ── SINGLE PERMITTED WRITE PATH ─────────────────────────────────────────────
  //   applyListingTransition()        ← action-based (primary)
  //   applyListingTransitionByStatus() ← status-bridge for UI flows
  //   Both in: src/modules/listings/actions/applyListingTransition.ts
  //
  // ── Rule 1 — Direct .status comparison ──────────────────────────────────────
  //   Use helpers from '@/modules/listings/domain':
  //   isListingVisible()    replaces:  status === 'active'
  //   isListingHidden()     replaces:  status === 'pending' || status === 'inactive'
  //   isListingArchived()   replaces:  status === 'archived'
  //   isListingClosed()     replaces:  status === 'sold' || status === 'rented'
  //
  // ── Rule 2 — Raw status string literal as property value ─────────────────────
  //   { status: 'active' } → forbidden
  //   { status: variable } → allowed (engine result via transition.nextStatus)
  //   { active: 'success' } → allowed (display map — key, not value)
  //
  // ── Rule 3 — Status field in any .update() call ───────────────────────────────
  //   .update({ status: ... }) anywhere outside the mutation gateway → forbidden
  //   The gateway (applyListingTransition.ts) is the only exception.
  //
  // ── EXCEPTIONS (must never be expanded without architecture review) ──────────
  //   src/modules/listings/domain/**       — engine defines all status strings
  //   src/modules/listings/actions/applyListingTransition.ts — THE mutation gateway
  //   src/modules/listings/actions/createListing.ts — INSERT initial state (not a transition)
  //   src/**/*.test.ts / *.test.tsx        — test assertions use status literals
  //
  // To suppress a confirmed legitimate use in non-exception code, add:
  //   // eslint-disable-next-line no-restricted-syntax -- <reason>
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: [
      // Engine — all status strings are canonical here
      "src/modules/listings/domain/**",
      // THE mutation gateway — only permitted DB write for listing.status
      "src/modules/listings/actions/applyListingTransition.ts",
      // Initial listing INSERT — not a status transition, sets bootstrap state
      "src/modules/listings/actions/createListing.ts",
      // Tests — status literals in assertions are intentional
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      // Non-listing status contexts — these files operate on AuthStatus, TicketStatus,
      // PromiseSettledResult.status, or HTTP status codes; not ListingStatus.
      "src/lib/auth/**",
      "src/modules/auth/**",
      "src/app/admin/support/**",
      "src/modules/notifications/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        // Rule 1: Direct .status comparison — only fires for listing status values.
        // AuthStatus ('refreshing', 'authenticated', etc.), TicketStatus ('open', etc.)
        // and other status domains are intentionally excluded by the right-side value
        // constraint so they don't generate false positives.
        {
          selector:
            "BinaryExpression[right.type='Literal'][right.value=/^(active|inactive|sold|rented|archived|pending)$/]:matches([operator='==='],[operator='!==']) > MemberExpression.left[property.name='status']",
          message:
            "Direct .status comparison outside the semantic domain. " +
            "Use helpers from '@/modules/listings/domain': " +
            "isListingVisible(), isListingHidden(), isListingArchived(), isListingClosed(). " +
            "Display maps ({ active: 'success', ... }) are unaffected by this rule.",
        },
        // Rule 2: Raw listing status string literal as object property value.
        // Restricted to the 6 canonical ListingStatus values so non-listing status
        // domains (UserStatus, AuthStatus, HTTP codes) are not falsely caught.
        {
          selector:
            "Property[key.name='status'][value.type='Literal'][value.value=/^(active|inactive|sold|rented|archived|pending)$/]",
          message:
            "Raw status string literal outside the mutation gateway. " +
            "Use resolveTransition(status, action).nextStatus from '@/modules/listings/domain'. " +
            "For status-to-action bridge: getTransitionActionForStatus(from, to).",
        },
        // Rule 3: Status property in any .update() call
        // Catches .update({ status: ... }) — the forbidden mutation pattern.
        // Catches both variable and literal values to close all bypass paths.
        {
          selector:
            "CallExpression[callee.property.name='update'] Property[key.name='status']",
          message:
            "Direct status write in .update() outside the mutation gateway. " +
            "Use applyListingTransition() or applyListingTransitionByStatus() " +
            "from '@/modules/listings/actions/applyListingTransition'.",
        },
      ],
    },
  },

  // ── UI Primitive Governance ────────────────────────────────────────────────
  //
  // Enforces canonical UI primitive usage as defined in:
  //   docs/governance-enforcement.md §4A
  //   docs/ui-rules.md §12
  //
  // These rules prevent governance drift at the ESLint level:
  //   1. Non-lucide icon library imports (only lucide-react approved)
  //   2. window.location.href navigation (must use router.push)
  //   3. suppressHydrationWarning (must fix root cause, never mask)
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // Non-lucide icon libraries are forbidden — only lucide-react
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@heroicons/*'],
              message: 'Non-lucide icon library. Use lucide-react only (governance-enforcement.md §4A).',
            },
            {
              group: ['react-icons/*', 'react-icons'],
              message: 'Non-lucide icon library. Use lucide-react only (governance-enforcement.md §4A).',
            },
            {
              group: ['phosphor-react', '@phosphor-icons/*'],
              message: 'Non-lucide icon library. Use lucide-react only (governance-enforcement.md §4A).',
            },
            {
              group: ['feather-icons'],
              message: 'Non-lucide icon library. Use lucide-react only (governance-enforcement.md §4A).',
            },
          ],
        },
      ],
      // window.location.href ASSIGNMENT is forbidden — always use router.push.
      // Read-only accesses (.origin, .pathname, .search, .host) are allowed.
      // Only catches: window.location.href = "...", window.location.replace(...), window.location.assign(...)
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "AssignmentExpression[left.type='MemberExpression']" +
            "[left.object.type='MemberExpression']" +
            "[left.object.object.name='window']" +
            "[left.object.property.name='location']" +
            "[left.property.name='href']",
          message:
            'window.location.href assignment is forbidden. Use router.push() from next/navigation. ' +
            'See docs/ai-behavior.md — AI Governance Enforcement Rules.',
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression']" +
            "[callee.object.type='MemberExpression']" +
            "[callee.object.object.name='window']" +
            "[callee.object.property.name='location']" +
            "[callee.property.name=/^(replace|assign)$/]",
          message:
            'window.location.replace/assign is forbidden. Use router.push() from next/navigation. ' +
            'See docs/ai-behavior.md — AI Governance Enforcement Rules.',
        },
      ],
    },
  },

  // ── SSR / Hydration Governance ────────────────────────────────────────────
  //
  // suppressHydrationWarning masks hydration mismatches instead of fixing them.
  // Exception: app/layout.tsx — required by next-themes for dark/light mode FOUC prevention.
  // All other hydration issues must be fixed at the deterministic rendering/data layer.
  // See: docs/ai-behavior.md §SSR/Hydration Governance Enforcement
  {
    files: ['src/**/*.tsx'],
    ignores: [
      // next-themes requires suppressHydrationWarning on <html> to prevent FOUC on theme load
      'src/app/layout.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='suppressHydrationWarning']",
          message:
            'suppressHydrationWarning is forbidden. Fix the hydration mismatch at root cause. ' +
            'Exception: app/layout.tsx (next-themes). ' +
            'See docs/ai-behavior.md — SSR/Hydration Governance Enforcement.',
        },
      ],
    },
  },
]);

export default eslintConfig;
