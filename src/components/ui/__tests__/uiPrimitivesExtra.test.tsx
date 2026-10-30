/**
 * The parts of the shadcn-style primitives that the overlay tests do not reach (Task 923 Revision 7): the avatar family, the slider, the dropdown menu's radio
 * group / submenu / shortcut, the select's group / label / separator / sizes, the command dialog and the navigation menu's trigger / content / indicator.
 * Behaviour and accessibility only; the look is proved by the Stories.
 */
import React from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../../../../messages/en.json'
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '../avatar'
import { Slider } from '../slider'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuShortcut,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '../dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '../select'
import { Command, CommandDialog, CommandInput, CommandItem, CommandList } from '../command'
import { NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../navigation-menu'

const intl = (node: React.ReactElement) => render(<NextIntlClientProvider locale="en" messages={messages as never}>{node}</NextIntlClientProvider>)

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })))
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => cleanup())

describe('Avatar family', () => {
  it('the avatar carries its slot and size, "default" unless told otherwise, and merges a class', () => {
    const { container } = render(<><Avatar className="mine" /><Avatar size="lg" /><Avatar size="sm" /></>)
    const all = container.querySelectorAll('[data-slot="avatar"]')
    expect([...all].map((a) => a.getAttribute('data-size'))).toEqual(['default', 'lg', 'sm'])
    expect(all[0]).toHaveClass('mine')
    expect(all[0]).toHaveClass('rounded-full')
  })

  it('shows its fallback while there is no picture, with the slot', () => {
    render(<Avatar><AvatarImage src="" alt="Alba" /><AvatarFallback className="fb">AB</AvatarFallback></Avatar>)
    const fb = screen.getByText('AB')
    expect(fb).toHaveAttribute('data-slot', 'avatar-fallback')
    expect(fb).toHaveClass('fb')
    expect(screen.queryByRole('img', { name: 'Alba' })).toBeNull()
  })

  it('the picture component keeps its slot, class and accessible name when it is rendered', () => {
    const { container } = render(<Avatar><AvatarImage src="https://res.cloudinary.com/demo/a.jpg" alt="Alba" className="pic" /></Avatar>)
    // the image only mounts after it has loaded; before that the root holds nothing, never a broken picture
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[data-slot="avatar"]')).not.toBeNull()
  })

  it('badge, group and count pass their props and add their slots', () => {
    const { container } = render(
      <AvatarGroup className="g" data-testid="grp">
        <Avatar><AvatarFallback>A</AvatarFallback><AvatarBadge aria-label="online" className="b" /></Avatar>
        <AvatarGroupCount className="c">+3</AvatarGroupCount>
      </AvatarGroup>,
    )
    expect(screen.getByTestId('grp')).toHaveAttribute('data-slot', 'avatar-group')
    expect(screen.getByTestId('grp')).toHaveClass('g')
    expect(screen.getByLabelText('online')).toHaveAttribute('data-slot', 'avatar-badge')
    expect(screen.getByLabelText('online')).toHaveClass('b')
    expect(screen.getByText('+3')).toHaveAttribute('data-slot', 'avatar-group-count')
    expect(container.querySelectorAll('[data-slot="avatar"]')).toHaveLength(1)
  })
})

describe('Slider', () => {
  it('a single value has one thumb, a range has two', () => {
    const { container, rerender } = render(<Slider defaultValue={[30]} aria-label="price" />)
    expect(container.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(1)
    rerender(<Slider defaultValue={[10, 90]} aria-label="price" />)
    expect(container.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(2)
  })

  it('with no value at all it is a range over its minimum and maximum (two thumbs)', () => {
    const { container } = render(<Slider min={5} max={50} aria-label="x" />)
    expect(container.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(2)
    const inputs = container.querySelectorAll('input[type="range"]')
    expect([...inputs].map((i) => `${i.getAttribute('min')}-${i.getAttribute('max')}`)).toEqual(['5-50', '5-50'])
  })

  it('a controlled value decides the number of thumbs, even over a default', () => {
    const { container } = render(<Slider value={[1, 2, 3]} defaultValue={[1]} onValueChange={() => {}} aria-label="x" />)
    expect(container.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(3)
  })

  it('its track and range are present and the root takes a class', () => {
    const { container } = render(<Slider defaultValue={[40]} className="mine" aria-label="x" />)
    expect(container.querySelector('[data-slot="slider"]')).toHaveClass('mine')
    expect(container.querySelector('[data-slot="slider-track"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="slider-range"]')).not.toBeNull()
  })

  it('a thumb is a slider the keyboard can move within the limits', () => {
    const onChange = vi.fn()
    const { container } = render(<Slider defaultValue={[50]} min={0} max={100} step={10} onValueChange={onChange} aria-label="price" />)
    // without layout the thumb stays hidden in jsdom, so its range input is taken directly
    const thumb = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(thumb).toHaveAttribute('aria-valuenow', '50')
    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith([60], expect.anything())
    fireEvent.keyDown(thumb, { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith([100], expect.anything())
    fireEvent.keyDown(thumb, { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith([0], expect.anything())
  })

  it('a disabled slider is marked disabled on the root and on its range input (a browser sends it no keys)', () => {
    const { container } = render(<Slider defaultValue={[50]} disabled aria-label="x" />)
    expect(container.querySelector('input[type="range"]')).toBeDisabled()
    expect(container.querySelector('[data-slot="slider"]')).toHaveAttribute('data-disabled')
  })
})

describe('DropdownMenu extras', () => {
  it('a radio group reports the chosen value and shows which is chosen', () => {
    const onValue = vi.fn()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Sort</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="new" onValueChange={onValue}>
            <DropdownMenuRadioItem value="new">Newest</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="cheap">Cheapest</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sort' }))
    expect(screen.getByRole('menuitemradio', { name: 'Newest' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Cheapest' })).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Cheapest' }))
    expect(onValue).toHaveBeenCalledWith('cheap', expect.anything())
  })

  it('a destructive item, an inset item and label and shortcut keep their slots and variants', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>More</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel inset>Danger</DropdownMenuLabel>
            <DropdownMenuItem variant="destructive" inset>Delete<DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut></DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    const item = screen.getByRole('menuitem', { name: /Delete/ })
    expect(item).toHaveAttribute('data-variant', 'destructive')
    expect(item).toHaveAttribute('data-inset', 'true')
    expect(screen.getByText('⌘⌫')).toHaveAttribute('data-slot', 'dropdown-menu-shortcut')
    expect(screen.getByText('Danger')).toHaveAttribute('data-inset', 'true')
  })

  it('a submenu opens from its trigger with the keyboard and its item acts', () => {
    const onRename = vi.fn()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>File</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Share</DropdownMenuSubTrigger>
            <DropdownMenuSubContent><DropdownMenuItem onClick={onRename}>By e-mail</DropdownMenuItem></DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'File' }))
    const sub = screen.getByRole('menuitem', { name: 'Share' })
    expect(sub).toHaveAttribute('data-slot', 'dropdown-menu-sub-trigger')
    expect(screen.queryByRole('menuitem', { name: 'By e-mail' })).toBeNull()
    act(() => { sub.focus() })
    fireEvent.keyDown(sub, { key: 'ArrowRight' })
    const inner = screen.getByRole('menuitem', { name: 'By e-mail' })
    fireEvent.click(inner)
    expect(onRename).toHaveBeenCalledTimes(1)
  })
})

describe('Select extras', () => {
  function select(size?: 'xs' | 'sm' | 'default', variant?: 'outline' | 'default') {
    return intl(
      <Select defaultValue="a">
        <SelectTrigger aria-label="Kind" size={size as never} variant={variant as never}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Group one</SelectLabel>
            <SelectItem value="a">Alpha</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Group two</SelectLabel>
            <SelectItem value="b">Beta</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    )
  }

  it('groups, labels and a separator are in the opened list', () => {
    select()
    fireEvent.click(screen.getByRole('combobox', { name: 'Kind' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Group one')).toHaveAttribute('data-slot', 'select-label')
    expect(screen.getByText('Group two')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="select-separator"]')).not.toBeNull()
    expect(document.querySelectorAll('[data-slot="select-group"]')).toHaveLength(2)
  })

  it.each([
    ['xs', 'h-8'],
    ['sm', 'h-9'],
    ['default', 'h-11'],
  ] as const)('the %s size has the height class %s', (size, cls) => {
    select(size)
    expect(screen.getByRole('combobox', { name: 'Kind' })).toHaveClass(cls)
  })

  it('the outline variant has a border and the plain one does not', () => {
    const { unmount } = select('default', 'outline')
    expect(screen.getByRole('combobox', { name: 'Kind' })).toHaveClass('border')
    unmount()
    select('default', 'default')
    expect(screen.getByRole('combobox', { name: 'Kind' })).toHaveClass('border-0')
  })
})

describe('CommandDialog', () => {
  it('opens as a dialog with a hidden title and description and the search inside, and closes with Escape', () => {
    const onOpenChange = vi.fn()
    intl(
      <CommandDialog open onOpenChange={onOpenChange}>
        <Command><CommandInput placeholder="Search" /><CommandList><CommandItem>Go home</CommandItem></CommandList></Command>
      </CommandDialog>,
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByPlaceholderText('Search')).toBeInTheDocument()
    expect(within(dialog).getByText('Go home')).toBeInTheDocument()
    // the title and description sit beside the popup and are tied to it by aria-labelledby / aria-describedby
    expect(screen.getByText('Search for a command to run...')).toBeInTheDocument()
    expect(dialog).toHaveAccessibleName(messages.common.command_palette)
    expect(dialog).toHaveAccessibleDescription('Search for a command to run...')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it('a given title and description replace the defaults, and the close button is off unless asked', () => {
    const { unmount } = intl(
      <CommandDialog open title="Jump to" description="Pick a page"><Command><CommandList><CommandItem>x</CommandItem></CommandList></Command></CommandDialog>,
    )
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Jump to')
    expect(screen.getByText('Pick a page')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /close/i })).toBeNull()
    unmount()
    intl(<CommandDialog open showCloseButton><Command><CommandList><CommandItem>x</CommandItem></CommandList></Command></CommandDialog>)
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('a closed command dialog renders nothing', () => {
    intl(<CommandDialog open={false}><Command><CommandList><CommandItem>hidden</CommandItem></CommandList></Command></CommandDialog>)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('hidden')).toBeNull()
  })
})

describe('NavigationMenu extras', () => {
  it('a trigger opens its content, which holds links, and has a closed state first', () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="t">Buy</NavigationMenuTrigger>
            <NavigationMenuContent className="c"><NavigationMenuLink href="/apartments">Apartments</NavigationMenuLink></NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )
    const trigger = screen.getByRole('button', { name: 'Buy' })
    expect(trigger).toHaveAttribute('data-slot', 'navigation-menu-trigger')
    expect(trigger).toHaveClass('t')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Apartments' })).toBeNull()
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Apartments' })).toHaveAttribute('href', '/apartments')
  })

  it('the indicator keeps its slot and class', () => {
    const { container } = render(
      <NavigationMenu>
        <NavigationMenuList><NavigationMenuItem><NavigationMenuLink href="/x">X</NavigationMenuLink><NavigationMenuIndicator className="ind" /></NavigationMenuItem></NavigationMenuList>
      </NavigationMenu>,
    )
    const ind = container.querySelector('[data-slot="navigation-menu-indicator"]')
    expect(ind).not.toBeNull()
    expect(ind).toHaveClass('ind')
  })
})
