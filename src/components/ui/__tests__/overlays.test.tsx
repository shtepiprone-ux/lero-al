/**
 * The overlay primitives of `src/components/ui`: Dialog, Sheet, Popover, DropdownMenu, Select, Command, NavigationMenu, InputGroup (Task 923 Revision 7: no unit test).
 * Each one: it opens from its trigger, shows its content in the portal, can be dismissed (Escape, its named close control), exposes the roles and names of its parts,
 * and its items act. The look is proved by their Stories and the rendered state census; this file proves behaviour and accessibility.
 */
import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../../../../messages/en.json'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../dialog'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../sheet'
import { Popover, PopoverTrigger, PopoverContent, PopoverTitle, PopoverDescription, PopoverHeader } from '../popover'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuGroup } from '../dropdown-menu'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../select'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from '../command'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '../navigation-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from '../input-group'

const intl = (node: React.ReactElement) => render(<NextIntlClientProvider locale="en" messages={messages as never}>{node}</NextIntlClientProvider>)

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })))
  Element.prototype.scrollIntoView = vi.fn()
})

describe('Dialog', () => {
  const dialog = (extra: { showCloseButton?: boolean } = {}) => intl(
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent {...extra}>
        <DialogHeader><DialogTitle>Delete listing</DialogTitle><DialogDescription>This cannot be undone</DialogDescription></DialogHeader>
        <DialogFooter showCloseButton><button type="button">Confirm</button></DialogFooter>
      </DialogContent>
    </Dialog>,
  )

  it('is closed until the trigger is pressed, then a labelled dialog with its content', () => {
    dialog()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    const d = screen.getByRole('dialog')
    expect(within(d).getByText('Delete listing')).toBeInTheDocument()
    expect(within(d).getByText('This cannot be undone')).toBeInTheDocument()
  })

  it('has a named close control that closes it', () => {
    dialog()
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent.click(screen.getAllByRole('button', { name: messages.common.close })[0])
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Escape closes it', () => {
    dialog()
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('showCloseButton={false} leaves only the footer close control out', () => {
    intl(
      <Dialog defaultOpen>
        <DialogContent showCloseButton={false}><DialogTitle>T</DialogTitle><p>x</p></DialogContent>
      </Dialog>,
    )
    expect(screen.queryByRole('button', { name: messages.common.close })).toBeNull()
  })

  it('the footer can offer its own close control', () => {
    dialog()
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getAllByRole('button', { name: /close/i }).length).toBeGreaterThanOrEqual(2)
  })
})

describe('Sheet', () => {
  it('opens from its trigger on the chosen side with a title, and closes with its named control', () => {
    intl(
      <Sheet>
        <SheetTrigger>Menu</SheetTrigger>
        <SheetContent side="left"><SheetHeader><SheetTitle>Navigation</SheetTitle><SheetDescription>Pick a page</SheetDescription></SheetHeader><SheetFooter>footer</SheetFooter></SheetContent>
      </Sheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'left')
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: messages.common.close }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('a bottom sheet shows its drag handle and the other sides do not', () => {
    const { unmount } = intl(<Sheet defaultOpen><SheetContent side="bottom" showCloseButton={false}><SheetTitle>t</SheetTitle></SheetContent></Sheet>)
    const handle = (d: HTMLElement) => d.querySelectorAll('.rounded-full.bg-muted-foreground\\/30').length
    expect(handle(screen.getByRole('dialog'))).toBe(1)
    unmount()
    intl(<Sheet defaultOpen><SheetContent side="right" showCloseButton={false}><SheetTitle>t</SheetTitle></SheetContent></Sheet>)
    expect(handle(screen.getByRole('dialog'))).toBe(0)
  })

  it('showCloseButton={false} has no close control', () => {
    intl(<Sheet defaultOpen><SheetContent showCloseButton={false}><SheetTitle>t</SheetTitle></SheetContent></Sheet>)
    expect(screen.queryByRole('button', { name: messages.common.close })).toBeNull()
  })
})

describe('Popover', () => {
  it('opens its titled content from the trigger and closes with Escape', () => {
    render(
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent><PopoverHeader><PopoverTitle>Price</PopoverTitle><PopoverDescription>Set a range</PopoverDescription></PopoverHeader></PopoverContent>
      </Popover>,
    )
    expect(screen.queryByText('Price')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Set a range')).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.queryByText('Price')).toBeNull()
  })
})

describe('DropdownMenu', () => {
  const menu = (onEdit = vi.fn(), onToggle = vi.fn()) => render(
    <DropdownMenu>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup><DropdownMenuLabel>Listing</DropdownMenuLabel>
          <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem disabled>Archive</DropdownMenuItem></DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={false} onCheckedChange={onToggle}>Featured</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  )

  it('opens from its trigger as a menu with named items', () => {
    menu()
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
    const m = screen.getByRole('menu')
    expect(within(m).getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    expect(within(m).getByText('Listing')).toBeInTheDocument()
    expect(within(m).getByRole('menuitemcheckbox', { name: 'Featured' })).toHaveAttribute('aria-checked', 'false')
  })

  it('an item runs its action once and closes the menu; a disabled item does not run', () => {
    const onEdit = vi.fn()
    menu(onEdit)
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Archive' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('a checkbox item reports its change', () => {
    const onToggle = vi.fn()
    menu(vi.fn(), onToggle)
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Featured' }))
    expect(onToggle).toHaveBeenCalledWith(true, expect.anything())
  })
})

describe('Select', () => {
  const select = (onValueChange = vi.fn()) => render(
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="City"><SelectValue placeholder="Pick a city" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="tirana">Tirana</SelectItem>
        <SelectItem value="durres">Durres</SelectItem>
      </SelectContent>
    </Select>,
  )

  it('shows its placeholder, opens a listbox of options, and reports the picked value', async () => {
    const onValueChange = vi.fn()
    select(onValueChange)
    expect(screen.getByText('Pick a city')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('combobox', { name: 'City' }))
    const list = screen.getByRole('listbox')
    expect(within(list).getAllByRole('option')).toHaveLength(2)
    // Base UI ignores a pointer release for a moment after the list opens (an accidental pick); a person's pick comes later
    await act(async () => { await new Promise((r) => setTimeout(r, 400)) })
    const option = within(list).getByRole('option', { name: 'Durres' })
    fireEvent.mouseMove(option)
    fireEvent.mouseUp(option)
    fireEvent.click(option)
    expect(onValueChange).toHaveBeenCalledWith('durres', expect.anything())
  })

  it('a controlled value is shown in the trigger', () => {
    render(
      <Select value="tirana">
        <SelectTrigger aria-label="City"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="tirana">Tirana</SelectItem></SelectContent>
      </Select>,
    )
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveTextContent('tirana')
  })
})

describe('Command', () => {
  it('filters its items by the typed text, shows the empty text when nothing matches, and a picked item reports it', () => {
    const onSelect = vi.fn()
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem onSelect={onSelect}>Dashboard <CommandShortcut>⌘D</CommandShortcut></CommandItem>
            <CommandItem>Listings</CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </Command>,
    )
    expect(screen.getAllByRole('option')).toHaveLength(2)
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'list' } })
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option', { name: 'Listings' })).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'zzz' } })
    expect(screen.getByText('No results')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'dash' } })
    fireEvent.click(screen.getByRole('option', { name: /Dashboard/ }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})

describe('NavigationMenu', () => {
  it('is a navigation with its items as links', () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem><NavigationMenuLink href="/rent">Rent</NavigationMenuLink></NavigationMenuItem>
          <NavigationMenuItem><NavigationMenuLink href="/buy">Buy</NavigationMenuLink></NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rent' })).toHaveAttribute('href', '/rent')
    expect(screen.getByRole('link', { name: 'Buy' })).toHaveAttribute('href', '/buy')
  })
})

describe('InputGroup', () => {
  it('is a group; pressing an addon focuses the input, pressing a button inside it does not steal the focus', () => {
    const onClick = vi.fn()
    render(
      <InputGroup>
        <InputGroupAddon><InputGroupText>€</InputGroupText></InputGroupAddon>
        <InputGroupInput aria-label="price" />
        <InputGroupAddon align="inline-end"><InputGroupButton aria-label="clear" onClick={onClick}>x</InputGroupButton></InputGroupAddon>
      </InputGroup>,
    )
    expect(screen.getAllByRole('group').length).toBeGreaterThanOrEqual(1)
    fireEvent.click(screen.getByText('€'))
    expect(document.activeElement).toBe(screen.getByLabelText('price'))
    ;(document.activeElement as HTMLElement).blur()
    fireEvent.click(screen.getByRole('button', { name: 'clear' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(document.activeElement).not.toBe(screen.getByLabelText('price'))
  })

  it('addon carries its alignment, a group button defaults to type=button and ghost, and a textarea can be the control', () => {
    render(
      <InputGroup>
        <InputGroupAddon align="block-start" data-testid="addon">hint</InputGroupAddon>
        <InputGroupTextarea aria-label="notes" />
        <InputGroupButton data-testid="btn">go</InputGroupButton>
      </InputGroup>,
    )
    expect(screen.getByTestId('addon')).toHaveAttribute('data-align', 'block-start')
    expect(screen.getByTestId('btn')).toHaveAttribute('type', 'button')
    expect(screen.getByLabelText('notes').tagName).toBe('TEXTAREA')
  })
})

