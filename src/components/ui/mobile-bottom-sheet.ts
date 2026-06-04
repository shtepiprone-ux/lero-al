/**
 * Shared mobile bottom-sheet tokens — single source for all popup primitives.
 * Task 379: Select · Combobox · DropdownMenu · NavigationMenu · Popover · Command
 *
 * Reuses the same visual contract established by Dialog/Sheet in Task 373:
 *   bottom-anchored · full-width edge-to-edge · rounded-top-only · slide-up
 *   max-h-[90dvh] with internal scroll · drag-handle bar affordance
 */

/**
 * Apply to Base-UI `Positioner` to override its inline-style anchor positioning
 * at <640px. Uses `!important` (Tailwind `!` prefix) to beat inline styles.
 */
export const MOBILE_POSITIONER =
  "max-sm:!fixed max-sm:!inset-x-0 max-sm:!bottom-0 max-sm:!top-auto max-sm:!w-auto max-sm:!h-auto " +
  "max-sm:![transform:none] max-sm:![translate:none]"

/**
 * Apply to the popup surface (Base-UI `Popup`, custom dropdown div, etc.)
 * to render as a full-width bottom sheet at <640px.
 */
export const MOBILE_POPUP =
  "max-sm:w-full max-sm:max-w-none max-sm:max-h-[90dvh] max-sm:rounded-t-2xl max-sm:rounded-b-none"

/**
 * Slide-up animation for popups that use tw-animate-css data-open/data-closed.
 * Combines with MOBILE_POPUP on the same element.
 */
export const MOBILE_SLIDE_ANIMATION =
  "max-sm:data-open:animate-in max-sm:data-open:fade-in-0 max-sm:data-open:slide-in-from-bottom " +
  "max-sm:data-closed:animate-out max-sm:data-closed:fade-out-0 max-sm:data-closed:slide-out-to-bottom"

/** className for the drag-handle wrapper div — visible on mobile only. */
export const DRAG_HANDLE_WRAPPER =
  "hidden max-sm:flex justify-center py-2 shrink-0 pointer-events-none"

/** className for the inner drag-handle pill. */
export const DRAG_HANDLE_BAR =
  "h-1 w-10 rounded-full bg-muted-foreground/30"
