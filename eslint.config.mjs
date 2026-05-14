import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";

const toArray = (c) => (Array.isArray(c) ? c : [c]);

const eslintConfig = defineConfig([
  ...toArray(nextVitals),
  ...toArray(nextTs),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
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
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        // Rule 1: Direct .status comparison (MemberExpression on left side of ===)
        {
          selector:
            "BinaryExpression:matches([operator='==='],[operator='!==']) > MemberExpression.left[property.name='status']",
          message:
            "Direct .status comparison outside the semantic domain. " +
            "Use helpers from '@/modules/listings/domain': " +
            "isListingVisible(), isListingHidden(), isListingArchived(), isListingClosed(). " +
            "Display maps ({ active: 'success', ... }) are unaffected by this rule.",
        },
        // Rule 2: Raw status string literal as object property value
        // Catches { status: 'active' }; does NOT catch { active: 'success' } or { status: variable }.
        {
          selector:
            "Property[key.name='status'][value.type='Literal']",
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
]);

export default eslintConfig;
