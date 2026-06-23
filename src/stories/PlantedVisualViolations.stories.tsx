/**
 * Planted visual-violation stories — Task 467.
 *
 * Self-contained inline stories that intentionally reproduce generic
 * geometry/visual defect classes. They serve as standing fixtures that
 * exercise each harness failure class (and as a regression guard against
 * future weakening, including false-positive guard stories that must PASS).
 * The proof is the OLD/NEW owner-native manifest evidence, not these
 * story files alone.
 *
 * Most planted fixtures use role="button" WITHOUT data-slot="button" so
 * the OLD harness's Layer 2 full-width button check (assertion d, which
 * targets [data-slot="button"]) does NOT trip — proving the false-negative
 * class. Exception: UnstyledFrame intentionally uses data-slot="button" so
 * NEW styleIntegrity can evaluate controlThemed=false (the second failing
 * signal alongside bodyMargin="8px"). OLD proof confirms this exception
 * still PASSes under 5c2edabae (no style check in OLD harness).
 */
import { useLayoutEffect, useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

function PlantedWrapper({ children }: { children: React.ReactNode }) {
  return <div data-testid="planted-violations-root">{children}</div>
}

const meta: Meta<typeof PlantedWrapper> = {
  title: 'Planted/VisualViolations',
  component: PlantedWrapper,
}
export default meta
type Story = StoryObj<typeof PlantedWrapper>

// ── 1. Clipped button text ──────────────────────────────────────────────────
// A narrow overflow-hidden container clips a long button label.
// Expected: text-clipped FAIL (NEW harness), PASS (OLD harness)
const CLIPPED_LABEL = 'Btn-467: very long label that definitely gets clipped beyond container'
export const ClippedButtonText: Story = {
  render: () => (
    <PlantedWrapper>
      <div style={{ width: 60, overflow: 'hidden' }}>
        <div
          role="button"
          tabIndex={0}
          data-testid="planted-clipped-btn"
          style={{ whiteSpace: 'nowrap', padding: '8px 12px', cursor: 'pointer' }}
        >
          {CLIPPED_LABEL}
        </div>
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 2. Overlapping action row ───────────────────────────────────────────────
// Two interactive elements forced to overlap at the same coordinates.
// Expected: element-overlap FAIL (NEW harness), PASS (OLD harness)
export const OverlappingActions: Story = {
  render: () => (
    <PlantedWrapper>
      <div style={{ position: 'relative', width: 200, height: 50 }}>
        <div
          role="button"
          tabIndex={0}
          data-testid="planted-overlap-a"
          style={{ position: 'absolute', left: 0, top: 0, width: 120, height: 40, padding: 8, cursor: 'pointer' }}
        >
          {'Btn-A #467'}
        </div>
        <div
          role="button"
          tabIndex={0}
          data-testid="planted-overlap-b"
          style={{ position: 'absolute', left: 50, top: 0, width: 120, height: 40, padding: 8, cursor: 'pointer' }}
        >
          {'Btn-B #467'}
        </div>
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 3. Off-viewport control ─────────────────────────────────────────────────
// A button placed off the right viewport edge via position:fixed. Fixed
// positioning never affects document scrollWidth — the old harness's
// horizontal overflow check (assertion a) does NOT fire. The geometry
// layer detects rect.right > viewportWidth via getBoundingClientRect().
// A visible on-screen element prevents blank-screenshot.
// Expected: offscreen-control FAIL (NEW harness), PASS (OLD harness)
export const OffViewportControl: Story = {
  render: () => (
    <PlantedWrapper>
      <p>{'Visible content #467'}</p>
      <div
        role="button"
        tabIndex={0}
        data-testid="planted-offscreen-btn"
        style={{ position: 'fixed', right: -100, top: 100, width: 80, padding: 8, cursor: 'pointer' }}
      >
        {'Off-screen #467'}
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 4. Container clipped ────────────────────────────────────────────────────
// A wide button inside a narrow overflow-hidden parent — the button itself
// is clipped by its container.
// Expected: outside-container FAIL (NEW harness), PASS (OLD harness)
export const ContainerClipped: Story = {
  render: () => (
    <PlantedWrapper>
      <div
        data-testid="planted-container-clip"
        style={{ width: 100, overflow: 'hidden' }}
      >
        <div
          role="button"
          tabIndex={0}
          data-testid="planted-container-btn"
          style={{ width: 200, padding: 8, cursor: 'pointer' }}
        >
          {'Wide-btn #467 inside narrow container'}
        </div>
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 5. Known-good control (false-positive guard) ────────────────────────────
// A normal, properly rendered element that must NOT trip any geometry rule.
// Expected: PASS (both OLD and NEW harness)
export const KnownGoodControl: Story = {
  render: () => (
    <PlantedWrapper>
      <div
        role="button"
        tabIndex={0}
        data-testid="planted-good"
        style={{ padding: 8, cursor: 'pointer' }}
      >
        {'Btn-good #467'}
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 6. Ambiguous overlap (R1 proof — third state) ──────────────────────────
// Two elements that overlap but one is position:absolute over its own anchor —
// classified as ambiguous-overlap, NOT hard-FAIL, NOT clean-PASS.
// Expected: ambiguousOnly=true (NEW harness), PASS (OLD harness)
export const AmbiguousOverlap: Story = {
  render: () => (
    <PlantedWrapper>
      <div style={{ position: 'relative', width: 200, height: 50 }}>
        <div
          role="button"
          tabIndex={0}
          data-testid="planted-ambiguous-trigger"
          style={{ padding: 8, cursor: 'pointer', width: 120 }}
        >
          {'Trigger #467'}
        </div>
        <div
          role="button"
          tabIndex={0}
          data-testid="planted-ambiguous-popup"
          style={{ position: 'absolute', left: 0, top: 0, width: 120, height: 40, padding: 8, cursor: 'pointer' }}
        >
          {'Popup #467'}
        </div>
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 7. Intentional ellipsis (R2 proof — third state) ───────────────────────
// A link with text-overflow:ellipsis and an aria-label — should be classified
// as ambiguous (text-clipped-ellipsis), NOT hard text-clipped FAIL.
// Expected: ambiguousOnly=true (NEW harness), PASS (OLD harness)
// ── 8. Container escape (C2 — outside-container proof) ────────────────────
// An icon-only button (no text, aria-label only) positioned to overhang its
// overflow:hidden parent. Icon-only → text-clipped check skips (no text to
// clip). The element's bounding rect extends past the clip box →
// outside-container FAIL. Visible paragraph prevents blank-screenshot.
// Expected: outside-container FAIL (NEW harness), PASS (OLD harness)
export const ContainerEscape: Story = {
  render: () => (
    <PlantedWrapper>
      <p style={{ marginBottom: 8 }}>{'Container-escape proof: icon button extends past clip box.'}</p>
      <div
        data-testid="planted-escape-clip"
        style={{ width: 80, height: 40, overflow: 'hidden', position: 'relative' }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="#467"
          data-testid="planted-escape-btn"
          style={{ position: 'absolute', left: 50, top: 0, width: 60, height: 30, cursor: 'pointer', background: '#ccc' }}
        />
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 9. Unstyled frame (R4 — style-integrity proof) ───────────────────────
// Uses CSS `revert` (the standard cascade mechanism that rolls back past
// author stylesheets to UA defaults) to genuinely prevent DS/Tailwind
// styles from applying to the planted content:
//   body { margin: revert !important }  — reverts Tailwind preflight 0→UA 8px
//   [container] *, [container] { all: revert !important }  — reverts ALL
//     DS/Tailwind rules on planted content to UA defaults
// Does NOT disable/remove any stylesheets — Storybook infrastructure
// stays intact. Both OLD and NEW harness capture the identical frame.
// OLD harness: no style check → PASS.
// NEW harness: bodyMargin≠0px (preflightOk=false) + controlThemed=false
// (data-slot="button" div has zero UA styling after revert) = 2/4 failing
// signals → retries → still unstyled → unstyled-render FAIL.
// NOTE: font inherits "Geist" from un-reverted #storybook-root parent
// (CSS revert on child can't change inherited properties from ancestors),
// so the controlThemed signal provides the second failing check.
function UnstyledContent() {
  const didApply = useRef(false)
  useLayoutEffect(() => {
    if (didApply.current) return
    didApply.current = true
    const style = document.createElement('style')
    style.setAttribute('data-planted-unstyled', 'true')
    style.textContent = [
      'body { margin: revert !important; }',
      '[data-testid="planted-violations-root"],',
      '[data-testid="planted-violations-root"] * {',
      '  all: revert !important;',
      '}',
    ].join('\n')
    document.head.appendChild(style)
  }, [])
  return (
    <>
      <p>{'Planted unstyled frame for style-integrity proof R4.'}</p>
      <div role="button" tabIndex={0} data-slot="button" data-testid="planted-unstyled-btn">
        {'Unstyled #467'}
      </div>
    </>
  )
}
export const UnstyledFrame: Story = {
  render: () => (
    <PlantedWrapper>
      <UnstyledContent />
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

const ELLIPSIS_TEXT = 'Lnk-467-ellipsis-apartament-2+1-tirane-shume-i-mire-per-familje-te-vogel'
export const IntentionalEllipsis: Story = {
  render: () => (
    <PlantedWrapper>
      <a
        href="#"
        aria-label={ELLIPSIS_TEXT}
        data-testid="planted-ellipsis-link"
        style={{
          display: 'block',
          width: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: 8,
        }}
      >
        {ELLIPSIS_TEXT}
      </a>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 11. Sr-only icon button (FP-CLASS A guard) ──────────────────────────────
// Matches the REAL DialogClose pattern: <XIcon/> + <span class="sr-only">Close</span>
// with NO aria-label/title on the button. The sr-only span uses position:absolute
// + overflow:hidden + 1px dimensions + clip:rect(0,0,0,0) (standard Tailwind sr-only).
// The harness MUST NOT report text-clipped: the only text is visually hidden.
// This guards against ~688 false positives on dialog/sheet close buttons.
// Expected: PASS (both OLD and NEW harness)
export const SrOnlyIconButton: Story = {
  render: () => (
    <PlantedWrapper>
      <div
        role="button"
        tabIndex={0}
        data-testid="planted-sronly-btn"
        style={{
          position: 'relative',
          width: 32,
          height: 32,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 20 }}>{'✕'}</span>
        <span
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
          }}
        >
          {'Close dialog button with very long sr-only label that definitely exceeds the tiny 1px container width'}
        </span>
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 12. Narrow-range viewport guard (FP-CLASS B — mobile-only pattern) ──────
// Exercises the STORY_VIEWPORT_RANGE mechanism. At viewports beyond maxWidth,
// the harness must classify the cell as verdict='out-of-range', not a product
// defect. Proves the viewport-mismatch section works.
// Expected: PASS at 320–960, out-of-range at >=1024 (NEW harness); PASS (OLD)
export const NarrowRangeGuard: Story = {
  render: () => (
    <PlantedWrapper>
      <div data-testid="planted-narrow-range">
        <div
          role="button"
          tabIndex={0}
          data-testid="planted-narrow-range-btn"
          style={{ padding: 8, cursor: 'pointer' }}
        >
          {'Narrow-range #467'}
        </div>
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── 13. Large-range viewport guard (FP-CLASS C — desktop-only pattern) ───────
// Exercises the STORY_VIEWPORT_RANGE mechanism with a minWidth constraint.
// At viewports below minWidth, the harness must classify the cell as
// verdict='out-of-range', not a product defect.
// Expected: PASS at >=1024, out-of-range at <1024 (NEW harness); PASS (OLD)
export const LargeRangeGuard: Story = {
  render: () => (
    <PlantedWrapper>
      <div data-testid="planted-large-range">
        <p>{'Large-range guard #467'}</p>
        <div
          role="button"
          tabIndex={0}
          data-testid="planted-large-range-btn"
          style={{ padding: 8, cursor: 'pointer' }}
        >
          {'Large-range-btn #467'}
        </div>
      </div>
    </PlantedWrapper>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
