# Sprint 56 — Raw enum leaks and the detector that cannot see them

**Opened:** 2026-08-08. **Owner decision:** 2026-08-08 — the 675 §8 family contains a product defect and the exact
detector blind spot that hides it. They are one piece of work, and no open sprint covers either.

Why not an existing sprint, checked before opening this one:

| Sprint | Goal | Fit |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | No — different surface, and **D28** binds it to mechanism-only changes |
| **52** | Gates that stopped checking | Closest, but no: 52's gates went blind to their **own** subject. `check:locale-leak` never claimed lowercase coverage — this is a scope gap, not a regression, and 52 is already four ordered tasks deep |
| **54** | Mobile bottom-nav overlay collision | No — different surface |
| **55** | ARIA semantics no gate sees | No — 55 is about names and roles, this is about **values** reaching the user untranslated |

Opened per the 2026-08-01 owner rule: no open sprint fits → open the next one with its own plan file first.

---

## Goal

Raw enum values are reaching users as visible labels, and the gate built to catch exactly that cannot see them.
Close the detector gap first, let it find the leak, then close the leak.

## Both halves, verified against the repository 2026-08-08

**The leak (679).** `src/hooks/usePropertyTypes.ts:16` returns `PROPERTY_TYPES.map(pt => ({ value: pt.value, label:
pt.value }))` — the fallback path hands back the raw enum value as the label, with the file's own comment conceding
"caller must handle via i18n or raw display". This is the cause behind Tasks 671 and 675 recording `NOT VERIFIABLE`
against their R13.

**The blind spot (680).** `scripts/check-locale-leak.mjs:220` opens its candidate test with
`if (!/^[A-Z]/.test(value)) return false`. Any leaked value beginning with a lowercase letter is discarded before
any other check runs — and `PROPERTY_TYPES` values are lowercase enum keys. The gate is structurally incapable of
reporting this leak.

## Task

**679**, absorbing **680**. One task, because the detector fix supplies the failing arm the leak fix needs — the
two-armed plant this repo requires on every kickoff comes free here, and splitting them would mean 680 lands with
no observable effect and 679 lands with no gate that can witness it.

**Internal order is not optional.** Fix the detector first and capture it **failing** on the existing leak. Only
then fix the leak, and capture the same command passing. A kickoff that fixes the leak first has destroyed its own
evidence — the standing M1/M2/M4/M5 lesson, in its cheapest available form.

## Exit criteria

1. `check:locale-leak` reports a lowercase raw-enum leak, proven by the detector failing on the **pre-fix**
   `usePropertyTypes` fallback — a transcript of that failing run, not an assertion that it would fail.
2. The fallback returns localized labels, and the same command passes afterwards.
3. The repo-wide count of lowercase leaks the widened detector now finds is **recorded**, and each is either fixed
   or reserved with a number. Widening a detector and silently not reporting what it found repeats 722's defect.
4. 671's and 675's R13 `NOT VERIFIABLE` is revisited and either closed or explicitly left open with the reason.
