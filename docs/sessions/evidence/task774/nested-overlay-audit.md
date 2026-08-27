# Nested-overlay audit — Sprint 67 exit criterion 4

**Date:** 2026-08-27 · **Scope:** every render site in `src/` where one floating layer is nested inside another.
**Question asked:** which other compositions carry the Task 773 defect (a portalled inner list reading as an
outside click and dismissing its parent), and the Task 774 defect (inherited trigger width too narrow for the
label)?

**Answer: `RangeDatePicker` was the only instance. Nothing else in the repo is affected today.**

That is a real result, not a shrug — it holds because of the mechanism split below, and it stops holding the moment
someone nests a combobox inside a popover or a menu. The rule is recorded in
`docs/mantine-responsive-design-system.md` §18.10 so the next such composition is written correctly.

## Step 1 — which OUTER layers can even do this

Decided from the Mantine source, not from behavior:

| Outer layer | Dismiss mechanism | Source | Vulnerable? |
|---|---|---|---|
| `Popover` / `MantinePopover` | document `mousedown` + `composedPath()` containment against `[targetNode, dropdownNode]` | `Popover.mjs:159`, `use-click-outside.mjs` | **YES** |
| `Menu` / `MantineDropdownMenu` | wraps `Popover` (`Menu.mjs:21,127`) | same hook | **YES** |
| `Combobox` dropdown | renders `Popover.Dropdown` (`ComboboxDropdown.mjs`) | same hook | **YES** |
| `Drawer` / `Modal` / `ResponsiveBottomSheet` | `onClick` on the **overlay element itself** | `ModalBaseOverlay.mjs:27-29` | **No** |

The Drawer/Modal row is what makes the audit small. A portalled child is a *sibling* of the overlay, never the
overlay, so pressing it cannot dismiss the drawer. Confirmed empirically too: the owner's own screenshot shows the
calendar popover open **outside** the Advanced-filters drawer with the drawer still open.

## Step 2 — every consumer of every floating primitive

```
MantineCombobox      LocationCombobox · PhoneField · PropertyTypeCombobox · YearCombobox
                     RangeDatePicker · AuthSheet
MantineDropdownMenu  UserMenu · LocaleSwitcher
MantinePopover       RangeDatePicker · NotificationBellView
MantineDrawer        MobileNavDrawer · FiltersPanel · AuthSheet
MantineSelect        (no consumers)
MantineTooltip       (no consumers)
direct @mantine/core floating primitives outside patterns/  ->  none
  (AdminReportsManager imports `Select` from components/ui/select, not Mantine)
```

## Step 3 — verdict per nesting site

| # | Outer | Inner | Verdict |
|---|---|---|---|
| 1 | `RangeDatePicker` desktop calendar — **MantinePopover** | month + year `MantineCombobox` | **THE DEFECT.** Fixed by Tasks 773 (`withinPortal={false}`) + 774 (`dropdownMinWidth` 190/140). |
| 2 | `NotificationBellView` — **MantinePopover** | `NotificationCenter` | **Clean.** `NotificationCenter.tsx` renders no `Combobox`/`Select`/`Menu`/`Popover`/`Tooltip` — grepped, zero matches. |
| 3 | `UserMenu` — **MantineDropdownMenu** | `items={items}` (plain `DropdownMenuItemDef[]`) | **Clean.** No floating child. |
| 4 | `LocaleSwitcher` — **MantineDropdownMenu** | `items={items}` | **Clean.** No floating child. |
| 5 | `AuthSheet` — **MantineDrawer** (L810 wraps the body) | `MantineCombobox` (L430), `PhoneField` (L698) | **Safe by mechanism** — overlay-click dismiss. |
| 6 | `FiltersPanel` — **MantineDrawer** (L91–L400) | `LocationCombobox`, `YearCombobox`, `RangeDatePicker` | **Safe by mechanism**, and confirmed live by the owner's screenshot. |
| 7 | `MobileNavDrawer` — **MantineDrawer** | menu content | **Safe by mechanism.** |
| 8 | `ProfileTab` — legacy Radix `Dialog` | `PhoneField` L302/307, `LocationCombobox` | **Not nested.** The dialogs (delete / unsaved-changes, L441+) are *siblings* of the form fields, not ancestors. |
| 9 | `ListingFormShellView` — legacy Radix `Dialog` | `PropertyTypeCombobox` L175, `LocationCombobox` L285 | **Not nested.** Cancel dialog is at L332, after and outside the form body. |
| 10 | `AdminUserProfile` — legacy Radix `Dialog` | `LocationCombobox` L934, `PhoneField` L1003 | **Not nested.** `UnsavedChangesDialog` (L172-176) is a separate component. |

Rows 8–10 were checked by line position, not by assumption: in all three the `Dialog` is a confirm/guard dialog
rendered beside the form, and no combobox is inside its `DialogContent`.

## Residual risk this audit does NOT remove

1. **It is a point-in-time sweep, not a gate.** Nothing prevents the next nested composition from repeating this.
   A static detector — "a `Popover`/`Menu`-based layer whose subtree contains a floating child that does not pass
   `withinPortal={false}`" — is buildable as a governance script and is the natural follow-up. Not built here;
   Sprint 67 criterion 3 is answered by the runtime harness instead.
2. **Legacy Radix layers were classified by mechanism, not exercised.** Radix `Dialog` dismisses on
   `pointerDownOutside`, which *is* document-level and *would* be vulnerable to a portalled Mantine child. No such
   nesting exists today (rows 8–10), so it was not tested. If a combobox is ever placed inside a `DialogContent`,
   it must be re-examined — the Drawer/Modal "safe" verdict above does **not** transfer to Radix.
