"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { MOBILE_POSITIONER, MOBILE_POPUP, MOBILE_SLIDE_ANIMATION, DRAG_HANDLE_WRAPPER, DRAG_HANDLE_BAR } from "@/components/ui/mobile-bottom-sheet"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

/**
 * Renders the selected item's label (not raw value).
 * Label resolution: Base UI reads the `items` prop passed to `<Select>` (Root) and
 * maps the current value to its label automatically. Always pass
 * `items={[{ value, label }]}` to `<Select>` so this trigger shows the
 * localized/capitalized label without requiring the dropdown to be opened first.
 * Alternatively, pass a render function as `children`:
 *   `<SelectValue>{(val) => myLabelMap[val]}</SelectValue>`
 */
function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      // min-w-0 + overflow-hidden: flex children don't shrink below content width by
      // default — min-w-0 fixes that so long labels truncate instead of pushing the
      // chevron off-screen. overflow-hidden ensures the text clips cleanly (Task 382).
      className={cn("flex flex-1 min-w-0 overflow-hidden text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  variant = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "xs" | "sm" | "default"
  variant?: "default" | "outline"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        // Base — layout, typography, states.
        // w-full max-w-full min-w-0: fills container and never causes horizontal overflow;
        // whitespace-nowrap removed so long labels can be truncated by SelectValue's truncate.
        "flex w-full max-w-full min-w-0 items-center justify-between gap-1.5 rounded-xl px-3 py-2 text-sm text-foreground transition-colors outline-none select-none cursor-pointer",
        "focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "data-placeholder:text-muted-foreground",
        "*:data-[slot=select-value]:truncate *:data-[slot=select-value]:flex *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Size — plain classes, no data-attribute specificity issues
        size === "xs" ? "h-8 text-xs" : size === "sm" ? "h-9" : "h-11",
        // Variant
        variant === "outline"
          ? "border border-input bg-transparent hover:bg-muted/60"
          : "border-0 bg-muted",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className={cn("isolate z-50", MOBILE_POSITIONER)}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 overflow-x-hidden overflow-y-auto",
            "rounded-xl border border-border bg-popover text-popover-foreground shadow-lg",
            "py-1 origin-(--transform-origin)",
            "duration-100 data-[align-trigger=true]:animate-none",
            "sm:data-[side=bottom]:slide-in-from-top-2 sm:data-[side=top]:slide-in-from-bottom-2",
            "sm:data-[side=left]:slide-in-from-right-2 sm:data-[side=right]:slide-in-from-left-2",
            "data-open:animate-in data-open:fade-in-0 sm:data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 sm:data-closed:zoom-out-95",
            MOBILE_POPUP,
            MOBILE_SLIDE_ANIMATION,
            className
          )}
          {...props}
        >
          {/* Drag handle — mobile bottom sheet affordance */}
          <div className={DRAG_HANDLE_WRAPPER}>
            <div className={DRAG_HANDLE_BAR} />
          </div>
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Match combobox item: ghost-button style
        "flex w-full cursor-default select-none items-center gap-2 px-3 py-2 text-sm text-foreground rounded-none outline-none max-sm:min-h-11",
        "hover:bg-muted data-[highlighted]:bg-muted",
        "data-[selected]:font-medium",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex-1 break-words">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={<span className="flex items-center justify-center size-4 shrink-0 text-primary" />}
      >
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
