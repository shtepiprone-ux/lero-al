// @vitest-environment node
/**
 * Brand single-source ΔE sync gate (Task 694; provenance Task 661, review rider filed 2026-08-08).
 *
 * Task 661 made `src/design-system/brand.ts` the one authored brand-colour source: `theme.ts`
 * imports its tuple, `globals.css`'s `--brand-*` alias Mantine's own generated
 * `--mantine-color-brand-*` variables, and email templates re-export `BRAND_PRIMARY`/`BRAND_HOVER`
 * because email clients cannot consume CSS variables. Nothing enforced any of that — a re-authored
 * literal in `theme.ts`, a mis-indexed alias row, or a hand-edited hex anywhere in the chain could
 * silently drift the shipped colour away from the documented one. That is exactly what happened
 * before 661 landed: `#EC5447` had drifted to `#D25656` with nothing to catch it (ΔE00 6.8074 — see
 * the `#EC5447` vs `#D25656` case below, which is this gate's real-history plant arm, not a
 * hypothetical).
 *
 * **D35 (2026-08-10, owner):** the sibling `--overlay`/`--overlay-foreground` pair is deliberately
 * NOT covered here. That pair feeds an `@theme inline` opacity-modifier static fallback and cannot
 * be aliased to a runtime `var()` without reproducing Task 690's regression (see
 * `scripts/__tests__/overlay-dual-declaration.test.ts` and the D35 note in `docs/backlog.md` →
 * Standing notes). `--brand-*` lives in `:root`, never `@theme`, and the built CSS has zero
 * bg/text/border opacity-modifier utilities on any brand token, so the alias convention this gate
 * protects has never been applied to a token consumed with an opacity modifier — the two token
 * families are not analogous.
 *
 * **§3.4 / Task 676 boundary:** a full `globals.css` hex-comment census (every `--x: oklch(...)`
 * row with a trailing hex comment) found 11 rows with ΔE00 > 1.0 across the neutral and badge
 * namespaces (Task 694 preflight, 2026-08-10).
 * Those ten rows belong to Task 676 (Sprint 57), which classifies all stale hex comments in this
 * file before removing any. **`--brand-950` is the one row that belongs here instead** — it sits
 * inside the brand namespace this gate asserts on, and a gate that claims the brand chain is
 * machine-enforced cannot ship green while a value inside that same chain is known-wrong. Task 676
 * must not re-touch `--brand-950`.
 *
 * Comparison spans oklch() declarations, hex comments, and an authored hex tuple — three
 * representations of colour that a string compare cannot reconcile — so this gate measures
 * perceptual distance in CIEDE2000 rather than comparing text. See §10.3 below: the comparator is
 * self-validated against the Sharma et al. (2005) reference pairs and five oklch → sRGB anchors so
 * a broken conversion cannot silently report zero drift for everything (the M1/M2/M4/M5 failure
 * mode named in `docs/backlog.md` → Standing notes).
 *
 * Run: npx vitest run scripts/__tests__/brand-single-source.test.ts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { theme } from '@/design-system/mantine/theme'
import { brand } from '@/design-system/brand'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const GLOBALS_CSS_PATH = join(ROOT, 'src', 'app', 'globals.css')
const BASE_EMAIL_PATH = join(ROOT, 'src', 'modules', 'notifications', 'lib', 'emails', 'BaseEmail.tsx')

// ─────────────────────────────────────────────────────────────────────────────
// §10.3 — self-contained colour maths. No dependency (package.json has no
// culori/colorjs.io/chroma-js/colord/d3-color; color-convert is transitive-only
// and supports neither oklch nor CIEDE2000).
// ─────────────────────────────────────────────────────────────────────────────

interface Lab {
  L: number
  a: number
  b: number
}

function srgbGammaEncode(linear: number): number {
  return linear <= 0.0031308 ? linear * 12.92 : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055
}

function srgbGammaDecode(encoded: number): number {
  return encoded <= 0.04045 ? encoded / 12.92 : Math.pow((encoded + 0.055) / 1.055, 2.4)
}

/** oklch(L C H) → OKLab → LMS → linear sRGB → gamma-encoded sRGB, clamped, rounded to 8-bit hex. */
function oklchToSrgbHex(L: number, C: number, Hdeg: number): string {
  const hrad = (Hdeg * Math.PI) / 180
  const a = C * Math.cos(hrad)
  const b = C * Math.sin(hrad)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
  const to8bit = (linear: number) => Math.round(clamp01(srgbGammaEncode(linear)) * 255)
  const hex2 = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()

  return `#${hex2(to8bit(rLin))}${hex2(to8bit(gLin))}${hex2(to8bit(bLin))}`
}

/** sRGB hex → XYZ (D65) → CIE Lab (D65 white point 0.95047, 1.0, 1.08883). */
function hexToLab(hex: string): Lab {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255

  const rl = srgbGammaDecode(r)
  const gl = srgbGammaDecode(g)
  const bl = srgbGammaDecode(b)

  const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl
  const Y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl
  const Z = 0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl

  const Xn = 0.95047
  const Yn = 1.0
  const Zn = 1.08883
  const delta = 6 / 29
  const f = (t: number) => (t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29)
  const fx = f(X / Xn)
  const fy = f(Y / Yn)
  const fz = f(Z / Zn)

  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

/** CIEDE2000 perceptual colour distance between two CIE Lab colours (Sharma et al., 2005). */
function deltaE00(lab1: Lab, lab2: Lab): number {
  const { L: L1, a: a1, b: b1 } = lab1
  const { L: L2, a: a2, b: b2 } = lab2

  const C1 = Math.sqrt(a1 * a1 + b1 * b1)
  const C2 = Math.sqrt(a2 * a2 + b2 * b2)
  const Cbar = (C1 + C2) / 2

  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)))

  const a1p = a1 * (1 + G)
  const a2p = a2 * (1 + G)

  const C1p = Math.sqrt(a1p * a1p + b1 * b1)
  const C2p = Math.sqrt(a2p * a2p + b2 * b2)

  const h1p = ((Math.atan2(b1, a1p) * 180) / Math.PI + 360) % 360
  const h2p = ((Math.atan2(b2, a2p) * 180) / Math.PI + 360) % 360

  const deltaLp = L2 - L1
  const deltaCp = C2p - C1p

  let deltahp: number
  if (C1p * C2p === 0) {
    deltahp = 0
  } else if (Math.abs(h2p - h1p) <= 180) {
    deltahp = h2p - h1p
  } else if (h2p - h1p > 180) {
    deltahp = h2p - h1p - 360
  } else {
    deltahp = h2p - h1p + 360
  }

  const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((deltahp * Math.PI) / 180 / 2)

  const Lbarp = (L1 + L2) / 2
  const Cbarp = (C1p + C2p) / 2

  let hbarp: number
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p
  } else if (Math.abs(h1p - h2p) <= 180) {
    hbarp = (h1p + h2p) / 2
  } else if (h1p + h2p < 360) {
    hbarp = (h1p + h2p + 360) / 2
  } else {
    hbarp = (h1p + h2p - 360) / 2
  }

  const T =
    1 -
    0.17 * Math.cos(((hbarp - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * hbarp * Math.PI) / 180) +
    0.32 * Math.cos(((3 * hbarp + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * hbarp - 63) * Math.PI) / 180)

  const deltaTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2))
  const Rc = 2 * Math.sqrt(Cbarp ** 7 / (Cbarp ** 7 + 25 ** 7))

  const Sl = 1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2)
  const Sc = 1 + 0.045 * Cbarp
  const Sh = 1 + 0.015 * Cbarp * T

  const Rt = -Math.sin((2 * deltaTheta * Math.PI) / 180) * Rc

  return Math.sqrt(
    (deltaLp / Sl) ** 2 + (deltaCp / Sc) ** 2 + (deltaHp / Sh) ** 2 + Rt * (deltaCp / Sc) * (deltaHp / Sh)
  )
}

/** ΔE00 between two sRGB hex strings — the comparator every project assertion below reduces to. */
function hexDeltaE00(hexA: string, hexB: string): number {
  return deltaE00(hexToLab(hexA), hexToLab(hexB))
}

// A2 — tolerance is 0, measured (§3.3): every in-scope pair in this repository is exactly 0.0000
// today. A future intentional non-zero pair must be added to a named allowlist with a written
// reason in THIS file — never by raising this constant.
const DELTA_E_TOLERANCE_DP = 4

function fmtDeltaE(value: number): string {
  return value.toFixed(4)
}

// ─────────────────────────────────────────────────────────────────────────────
// File readers and extraction helpers
// ─────────────────────────────────────────────────────────────────────────────

function readGlobalsCss(): string {
  return readFileSync(GLOBALS_CSS_PATH, 'utf8')
}

function readBaseEmail(): string {
  return readFileSync(BASE_EMAIL_PATH, 'utf8')
}

/** Brace-depth extraction of a top-level block, never by line number (692 A2 precedent). */
function extractBlock(content: string, openingLine: string, blockLabel: string): string {
  const openIndex = content.indexOf(`${openingLine} {`)
  if (openIndex === -1) {
    throw new Error(`${GLOBALS_CSS_PATH}: could not find opening line "${openingLine} {" for ${blockLabel}`)
  }
  const bodyStart = openIndex + openingLine.length + 2
  let depth = 1
  let i = bodyStart
  while (depth > 0) {
    if (i >= content.length) {
      throw new Error(`${GLOBALS_CSS_PATH}: ${blockLabel} starting at "${openingLine} {" never closes`)
    }
    if (content[i] === '{') depth++
    else if (content[i] === '}') depth--
    i++
  }
  return content.slice(bodyStart, i - 1)
}

interface AliasRow {
  mantineIndex: number
  commentHex: string
}

/** Locates `--brand-{token}: var(--mantine-color-brand-N);` and its trailing `#RRGGBB` comment. */
function extractBrandAliasRow(rootBlock: string, token: number): AliasRow {
  const re = new RegExp(
    `^[ \\t]*--brand-${token}:\\s*var\\(--mantine-color-brand-(\\d+)\\);[^\\n]*?(#[0-9A-Fa-f]{6})`,
    'm'
  )
  const m = rootBlock.match(re)
  if (!m) {
    throw new Error(
      `${GLOBALS_CSS_PATH}: could not find a "--brand-${token}: var(--mantine-color-brand-N);" declaration ` +
        `with a trailing #RRGGBB comment inside :root`
    )
  }
  return { mantineIndex: Number(m[1]), commentHex: `#${m[2]!.slice(1).toUpperCase()}` }
}

function countBrandAliasDeclarations(rootBlock: string): number {
  const re = /^[ \t]*--brand-\d+:\s*var\(--mantine-color-brand-\d+\);/gm
  return [...rootBlock.matchAll(re)].length
}

interface AccentRow {
  mantineIndex: number
  commentHex: string
}

function extractAccentRow(rootBlock: string): AccentRow {
  const re = /^[ \t]*--accent:\s*var\(--mantine-color-brand-(\d+)\);[^\n]*?(#[0-9A-Fa-f]{6})/m
  const m = rootBlock.match(re)
  if (!m) {
    throw new Error(
      `${GLOBALS_CSS_PATH}: could not find a "--accent: var(--mantine-color-brand-N);" declaration ` +
        `with a trailing #RRGGBB comment inside :root`
    )
  }
  return { mantineIndex: Number(m[1]), commentHex: `#${m[2]!.slice(1).toUpperCase()}` }
}

interface Brand950 {
  oklchHex: string
  blockCommentText: string
  blockCommentHex: string
  trailingCommentHex: string
}

function extractBrand950(rootBlock: string): Brand950 {
  const blockCommentMatch = rootBlock.match(/\/\*\s*--brand-950[\s\S]*?\*\//)
  if (!blockCommentMatch) {
    throw new Error(`${GLOBALS_CSS_PATH}: could not find the block comment above the --brand-950 declaration`)
  }
  const blockCommentText = blockCommentMatch[0]
  const blockCommentHexMatch = blockCommentText.match(/#([0-9A-Fa-f]{6})/)
  if (!blockCommentHexMatch) {
    throw new Error(`${GLOBALS_CSS_PATH}: the --brand-950 block comment contains no #RRGGBB hex`)
  }

  const declMatch = rootBlock.match(/--brand-950:\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\);[^\n]*?(#[0-9A-Fa-f]{6})/)
  if (!declMatch) {
    throw new Error(
      `${GLOBALS_CSS_PATH}: could not find "--brand-950: oklch(L C H);" with a trailing #RRGGBB comment`
    )
  }
  const [, Lstr, Cstr, Hstr, trailingHexRaw] = declMatch
  const oklchHex = oklchToSrgbHex(Number(Lstr), Number(Cstr), Number(Hstr))

  return {
    oklchHex,
    blockCommentText,
    blockCommentHex: `#${blockCommentHexMatch[1]!.toUpperCase()}`,
    trailingCommentHex: `#${trailingHexRaw!.slice(1).toUpperCase()}`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// §10.3 — self-validation. Must run and pass before any project-value assertion
// is trusted: a comparator that silently returns 0 for everything would make
// every assertion below pass vacuously (the M1/M2/M4/M5 failure mode).
// ─────────────────────────────────────────────────────────────────────────────

describe('§10.3 self-validating colour maths (R6) — must pass before any project assertion is trusted', () => {
  it('CIEDE2000 matches the Sharma et al. (2005) reference pairs to 4 dp', () => {
    const cases: Array<[Lab, Lab, number]> = [
      [{ L: 50, a: 2.6772, b: -79.7751 }, { L: 50, a: 0, b: -82.7485 }, 2.0425],
      [{ L: 50, a: 3.1571, b: -77.2803 }, { L: 50, a: 0, b: -82.7485 }, 2.8615],
      [{ L: 50, a: 2.8361, b: -74.02 }, { L: 50, a: 0, b: -82.7485 }, 3.4412],
      [{ L: 50, a: -1.3802, b: -84.2814 }, { L: 50, a: 0, b: -82.7485 }, 1.0],
      [{ L: 60.2574, a: -34.0099, b: 36.2677 }, { L: 60.4626, a: -34.1751, b: 39.4387 }, 1.2644],
      [{ L: 22.7233, a: 20.0904, b: -46.694 }, { L: 23.0331, a: 14.973, b: -42.5619 }, 2.0373],
    ]
    for (const [lab1, lab2, expected] of cases) {
      const got = deltaE00(lab1, lab2)
      expect(
        Number(fmtDeltaE(got)),
        `CIEDE2000(${JSON.stringify(lab1)}, ${JSON.stringify(lab2)}) = ${fmtDeltaE(got)}, expected ${expected.toFixed(4)} ` +
          `(Sharma et al. reference pair mismatch — a reference-pair mismatch means the CIEDE2000 coefficients are wrong)`
      ).toBeCloseTo(expected, DELTA_E_TOLERANCE_DP)
    }
  })

  it('oklch → sRGB conversion matches five exact anchors', () => {
    const anchors: Array<[number, number, number, string]> = [
      [1, 0, 0, '#FFFFFF'],
      [0, 0, 0, '#000000'],
      [0.628, 0.2577, 29.23, '#FF0000'],
      [0.8664, 0.2948, 142.4953, '#00FF00'],
      [0.452, 0.3132, 264.052, '#0000FF'],
    ]
    for (const [L, C, H, expectedHex] of anchors) {
      const got = oklchToSrgbHex(L, C, H)
      expect(
        got,
        `oklch(${L} ${C} ${H}) → ${got}, expected ${expectedHex} (oklch → sRGB anchor mismatch — a reference-pair ` +
          `mismatch means the OKLab → linear sRGB matrix is wrong)`
      ).toBe(expectedHex)
    }
  })

  it('the proven #180807 round trip: oklch(0.132 0.022 23) renders #0F0504, not its own comment hex', () => {
    const got = oklchToSrgbHex(0.132, 0.022, 23)
    expect(got, `oklch(0.132 0.022 23) → ${got}, expected #0F0504`).toBe('#0F0504')
    expect(
      Number(fmtDeltaE(hexDeltaE00(got, '#180807'))),
      'oklch(0.132 0.022 23) vs its stale documented hex #180807 must measure the known 3.6446 drift'
    ).toBeCloseTo(3.6446, DELTA_E_TOLERANCE_DP)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Assertion A (R1) — theme.ts consumes brand.ts by import identity, not a
// re-authored literal. `toBe`, not `toEqual`: a literal tuple with identical
// values must still fail here (plant P4).
// ─────────────────────────────────────────────────────────────────────────────

describe('assertion A (R1) — theme.ts consumes brand.ts brand tuple by identity', () => {
  it('theme.colors.brand is the same array reference as the brand.ts export', () => {
    expect(
      theme.colors!.brand,
      `${join(ROOT, 'src', 'design-system', 'mantine', 'theme.ts')}: theme.colors.brand is not the same array ` +
        `identity as src/design-system/brand.ts's exported "brand" tuple. theme.ts must consume brand.ts by ` +
        `import (colors: { brand, ... }), never by a re-authored literal tuple — even one with identical values.`
    ).toBe(brand)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Assertion B (R2, R3, R7) — the 10 --brand-{50..900} alias rows: correct
// index mapping (P3) and ΔE00 = 0 comment-hex fidelity against brand[N]
// (P1, P2). A reworded comment with an unchanged hex (P6) must still pass.
// ─────────────────────────────────────────────────────────────────────────────

const EXPECTED_BRAND_ALIASES: Array<{ token: number; mantineIndex: number }> = [
  { token: 50, mantineIndex: 0 },
  { token: 100, mantineIndex: 1 },
  { token: 200, mantineIndex: 2 },
  { token: 300, mantineIndex: 3 },
  { token: 400, mantineIndex: 4 },
  { token: 500, mantineIndex: 5 },
  { token: 600, mantineIndex: 6 },
  { token: 700, mantineIndex: 7 },
  { token: 800, mantineIndex: 8 },
  { token: 900, mantineIndex: 9 },
]

describe('assertion B (R2, R3, R7) — globals.css :root brand alias index mapping and ΔE00 fidelity', () => {
  it('declares exactly 10 --brand-{50,100,...,900} rows', () => {
    const rootBlock = extractBlock(readGlobalsCss(), ':root', ':root')
    const count = countBrandAliasDeclarations(rootBlock)
    expect(
      count,
      `${GLOBALS_CSS_PATH}: expected exactly 10 "--brand-N: var(--mantine-color-brand-M);" rows inside :root, found ${count}.`
    ).toBe(10)
  })

  for (const { token, mantineIndex } of EXPECTED_BRAND_ALIASES) {
    it(`--brand-${token} maps to --mantine-color-brand-${mantineIndex} (index mapping, not a ΔE)`, () => {
      const rootBlock = extractBlock(readGlobalsCss(), ':root', ':root')
      const row = extractBrandAliasRow(rootBlock, token)
      expect(
        row.mantineIndex,
        `${GLOBALS_CSS_PATH}: --brand-${token} declares var(--mantine-color-brand-${row.mantineIndex}), expected ` +
          `var(--mantine-color-brand-${mantineIndex}). This is an index mapping defect, not a colour drift.`
      ).toBe(mantineIndex)
    })

    it(`--brand-${token}'s comment hex measures ΔE00 = 0 against brand[${mantineIndex}]`, () => {
      const rootBlock = extractBlock(readGlobalsCss(), ':root', ':root')
      const row = extractBrandAliasRow(rootBlock, token)
      const expectedHex = brand[mantineIndex]!.toUpperCase()
      const de = hexDeltaE00(row.commentHex, expectedHex)
      expect(
        Number(fmtDeltaE(de)),
        `${GLOBALS_CSS_PATH}: --brand-${token} comment hex ${row.commentHex} vs brand[${mantineIndex}] ` +
          `${expectedHex} measures ΔE00 ${fmtDeltaE(de)} (tolerance 0). ` +
          `A reworded comment with the same hex must NOT trigger this — only the hex value is compared.`
      ).toBeCloseTo(0, DELTA_E_TOLERANCE_DP)
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Assertion C (R2) — --accent aliases --mantine-color-brand-0 and its comment
// hex matches brand[0].
// ─────────────────────────────────────────────────────────────────────────────

describe('assertion C (R2) — --accent aliases brand[0]', () => {
  it('--accent declares var(--mantine-color-brand-0) with a ΔE00 = 0 comment hex against brand[0]', () => {
    const rootBlock = extractBlock(readGlobalsCss(), ':root', ':root')
    const row = extractAccentRow(rootBlock)
    expect(
      row.mantineIndex,
      `${GLOBALS_CSS_PATH}: --accent declares var(--mantine-color-brand-${row.mantineIndex}), expected ` +
        `var(--mantine-color-brand-0).`
    ).toBe(0)

    const expectedHex = brand[0]!.toUpperCase()
    const de = hexDeltaE00(row.commentHex, expectedHex)
    expect(
      Number(fmtDeltaE(de)),
      `${GLOBALS_CSS_PATH}: --accent comment hex ${row.commentHex} vs brand[0] ${expectedHex} measures ΔE00 ${fmtDeltaE(de)} (tolerance 0).`
    ).toBeCloseTo(0, DELTA_E_TOLERANCE_DP)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Assertion D (R4) — --brand-950's oklch() value, converted to sRGB, matches
// both its block comment hex and its trailing comment hex at ΔE00 = 0. Before
// the §10.5 product edit this measured 3.6446 at both sites (AC5).
// ─────────────────────────────────────────────────────────────────────────────

describe('assertion D (R4) — --brand-950 comment matches what its oklch() value actually renders', () => {
  it('the block comment above the declaration states the rendered colour', () => {
    const rootBlock = extractBlock(readGlobalsCss(), ':root', ':root')
    const b950 = extractBrand950(rootBlock)
    const de = hexDeltaE00(b950.oklchHex, b950.blockCommentHex)
    expect(
      Number(fmtDeltaE(de)),
      `${GLOBALS_CSS_PATH}: --brand-950's oklch() renders ${b950.oklchHex}, but its block comment states ` +
        `${b950.blockCommentHex} — ΔE00 ${fmtDeltaE(de)} (tolerance 0; pre-694 this measured 3.6446).`
    ).toBeCloseTo(0, DELTA_E_TOLERANCE_DP)
  })

  it('the trailing comment on the declaration line states the rendered colour', () => {
    const rootBlock = extractBlock(readGlobalsCss(), ':root', ':root')
    const b950 = extractBrand950(rootBlock)
    const de = hexDeltaE00(b950.oklchHex, b950.trailingCommentHex)
    expect(
      Number(fmtDeltaE(de)),
      `${GLOBALS_CSS_PATH}: --brand-950's oklch() renders ${b950.oklchHex}, but its trailing comment states ` +
        `${b950.trailingCommentHex} — ΔE00 ${fmtDeltaE(de)} (tolerance 0; pre-694 this measured 3.6446).`
    ).toBeCloseTo(0, DELTA_E_TOLERANCE_DP)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Assertion E (R2) — BaseEmail.tsx still imports BRAND_PRIMARY/BRAND_HOVER
// from brand.ts, and its header-comment hexes match brand[7]/brand[8].
// ─────────────────────────────────────────────────────────────────────────────

describe('assertion E (R2) — BaseEmail.tsx sources its brand hexes from brand.ts', () => {
  it('imports BRAND_PRIMARY and BRAND_HOVER from @/design-system/brand', () => {
    const source = readBaseEmail()
    const hasImport = /import\s*\{\s*BRAND_PRIMARY\s*,\s*BRAND_HOVER\s*\}\s*from\s*['"]@\/design-system\/brand['"]/.test(
      source
    )
    expect(
      hasImport,
      `${BASE_EMAIL_PATH}: expected "import { BRAND_PRIMARY, BRAND_HOVER } from '@/design-system/brand'" — ` +
        `BaseEmail must not re-author these hexes locally.`
    ).toBe(true)
  })

  it('header comment hexes match brand[7] (BRAND_PRIMARY) and brand[8] (BRAND_HOVER) at ΔE00 = 0', () => {
    const source = readBaseEmail()
    const primaryMatch = source.match(/BRAND_PRIMARY\s*\(#([0-9A-Fa-f]{6})\)/)
    const hoverMatch = source.match(/BRAND_HOVER\s*\(#([0-9A-Fa-f]{6})/)
    if (!primaryMatch || !hoverMatch) {
      throw new Error(
        `${BASE_EMAIL_PATH}: could not find "BRAND_PRIMARY (#RRGGBB)" and "BRAND_HOVER (#RRGGBB" in the header comment`
      )
    }

    const primaryHex = `#${primaryMatch[1]!.toUpperCase()}`
    const expectedPrimary = brand[7]!.toUpperCase()
    const dePrimary = hexDeltaE00(primaryHex, expectedPrimary)
    expect(
      Number(fmtDeltaE(dePrimary)),
      `${BASE_EMAIL_PATH}: header comment BRAND_PRIMARY hex ${primaryHex} vs brand[7] ${expectedPrimary} measures ΔE00 ${fmtDeltaE(dePrimary)} (tolerance 0).`
    ).toBeCloseTo(0, DELTA_E_TOLERANCE_DP)

    const hoverHex = `#${hoverMatch[1]!.toUpperCase()}`
    const expectedHover = brand[8]!.toUpperCase()
    const deHover = hexDeltaE00(hoverHex, expectedHover)
    expect(
      Number(fmtDeltaE(deHover)),
      `${BASE_EMAIL_PATH}: header comment BRAND_HOVER hex ${hoverHex} vs brand[8] ${expectedHover} measures ΔE00 ${fmtDeltaE(deHover)} (tolerance 0).`
    ).toBeCloseTo(0, DELTA_E_TOLERANCE_DP)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Assertion F (R5) — the --brand-950 declared exemption (724 F2 corollary: an
// exemption an author applies in the gate is reviewable; one product code can
// synthesise is not). Deleting the exemption text must fail the gate.
// ─────────────────────────────────────────────────────────────────────────────

describe('assertion F (R5) — --brand-950 carries its declared non-tuple-derived exemption', () => {
  it('the block comment still states the exemption and cites Task 661', () => {
    const rootBlock = extractBlock(readGlobalsCss(), ':root', ':root')
    const b950 = extractBrand950(rootBlock)

    expect(
      b950.blockCommentText.includes('intentionally NOT tuple-derived'),
      `${GLOBALS_CSS_PATH}: the --brand-950 block comment no longer contains the literal substring ` +
        `"intentionally NOT tuple-derived". --brand-950 is the one brand-namespace value that is NOT ` +
        `derived from src/design-system/brand.ts, and that exemption must stay declared in the gate's ` +
        `input (the comment), not assumed silently.`
    ).toBe(true)

    expect(
      b950.blockCommentText.includes('Task 661'),
      `${GLOBALS_CSS_PATH}: the --brand-950 block comment no longer cites "Task 661" — the exemption's provenance ` +
        `must stay traceable.`
    ).toBe(true)
  })
})
