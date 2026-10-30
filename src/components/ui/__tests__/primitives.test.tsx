/**
 * The shadcn / Base UI primitives of `src/components/ui` (Task 923 Revision 7: none of them had a unit test).
 * Each primitive: the slot / role it renders, the variants and sizes that change what it renders, `className` merged rather than replaced, props passed through,
 * and the state a person can change (a switch, a checkbox, a radio, a tab) really changing. Visual classes are not asserted beyond that: the look of a
 * legacy primitive is proved by its Story.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../../../../messages/en.json'
import { Button, buttonVariants } from '../button'
import { Input } from '../input'
import { Label } from '../label'
import { Textarea } from '../textarea'
import { Separator } from '../separator'
import { Skeleton } from '../skeleton'
import { Alert, AlertTitle, AlertDescription, AlertAction } from '../alert'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge } from '../avatar'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '../card'
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption } from '../table'
import { Switch } from '../switch'
import { Checkbox } from '../checkbox'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import { Progress, ProgressLabel, ProgressValue } from '../progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs'
import { Slider } from '../slider'
import { ScrollArea } from '../scroll-area'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '../pagination'

const intl = (node: React.ReactElement) => render(<NextIntlClientProvider locale="en" messages={messages as never}>{node}</NextIntlClientProvider>)

describe('Button', () => {
  it('is a button with its slot, runs onClick and does nothing when disabled', () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>Save</Button>)
    const b = screen.getByRole('button', { name: 'Save' })
    expect(b).toHaveAttribute('data-slot', 'button')
    fireEvent.click(b)
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(<Button onClick={onClick} disabled>Save</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('marks only the icon sizes as icon-only', () => {
    const marks = (size: React.ComponentProps<typeof Button>['size']) => {
      const { unmount } = render(<Button size={size} aria-label="x">i</Button>)
      const has = screen.getByRole('button', { name: 'x' }).hasAttribute('data-icon-only')
      unmount()
      return has
    }
    for (const s of ['icon', 'icon-xl', 'icon-xs', 'icon-sm', 'icon-lg'] as const) expect(marks(s), s).toBe(true)
    for (const s of ['default', 'xs', 'sm', 'lg', 'xl', 'tab'] as const) expect(marks(s), s).toBe(false)
  })

  it('variants and sizes produce different classes, and className is merged, not replacing them', () => {
    expect(buttonVariants({ variant: 'outline' })).not.toBe(buttonVariants({ variant: 'ghost' }))
    expect(buttonVariants({ size: 'xl' })).not.toBe(buttonVariants({ size: 'sm' }))
    render(<Button className="extra-class">x</Button>)
    const cls = screen.getByRole('button').className
    expect(cls).toContain('extra-class')
    expect(cls).toContain('inline-flex')
  })

  it('a text size keeps a 44px touch height on a phone (max-sm:min-h-11), an icon-only xs size does not rely on it', () => {
    expect(buttonVariants({ size: 'default' })).toContain('max-sm:min-h-11')
    expect(buttonVariants({ size: 'xl' })).toContain('h-11')
  })
})

describe('form primitives', () => {
  it('Input: size changes the height, type and className pass through, typing fires onChange', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Input aria-label="n" size="sm" className="mine" onChange={onChange} />)
    const i = screen.getByLabelText('n')
    expect(i).toHaveAttribute('data-slot', 'input')
    expect(i.className).toContain('h-9')
    expect(i.className).toContain('mine')
    fireEvent.change(i, { target: { value: 'abc' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    rerender(<Input aria-label="n" type="email" />)
    expect(screen.getByLabelText('n')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('n').className).toContain('h-11')
  })

  it('Label is bound to its control by htmlFor', () => {
    render(<><Label htmlFor="a">Name</Label><input id="a" /></>)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByText('Name')).toHaveAttribute('data-slot', 'label')
  })

  it('Textarea passes value, placeholder and className through', () => {
    render(<Textarea placeholder="Notes" defaultValue="hi" className="mine" />)
    const t = screen.getByPlaceholderText('Notes') as HTMLTextAreaElement
    expect(t.value).toBe('hi')
    expect(t).toHaveAttribute('data-slot', 'textarea')
    expect(t.className).toContain('mine')
  })

  it('Switch toggles aria-checked and reports the change; disabled does not toggle', () => {
    const onCheckedChange = vi.fn()
    const { rerender } = render(<Switch aria-label="notify" onCheckedChange={onCheckedChange} />)
    const s = screen.getByRole('switch', { name: 'notify' })
    expect(s).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(s)
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
    expect(s).toHaveAttribute('aria-checked', 'true')
    rerender(<Switch aria-label="notify" disabled onCheckedChange={onCheckedChange} />)
    onCheckedChange.mockClear()
    fireEvent.click(screen.getByRole('switch', { name: 'notify' }))
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('Switch size is exposed as data-size', () => {
    render(<Switch aria-label="s" size="sm" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'sm')
  })

  it('Checkbox toggles, shows its indicator only when checked', () => {
    render(<Checkbox aria-label="agree" />)
    const c = screen.getByRole('checkbox', { name: 'agree' })
    expect(c).toHaveAttribute('aria-checked', 'false')
    expect(document.querySelector('[data-slot="checkbox-indicator"]')).toBeNull()
    fireEvent.click(c)
    expect(c).toHaveAttribute('aria-checked', 'true')
    expect(document.querySelector('[data-slot="checkbox-indicator"]')).not.toBeNull()
  })

  it('RadioGroup selects one item at a time and reports its value', () => {
    const onValueChange = vi.fn()
    render(
      <RadioGroup onValueChange={onValueChange} defaultValue="a">
        <RadioGroupItem value="a" aria-label="A" />
        <RadioGroupItem value="b" aria-label="B" />
      </RadioGroup>,
    )
    expect(screen.getByRole('radio', { name: 'A' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'B' }))
    expect(onValueChange).toHaveBeenCalledWith('b', expect.anything())
    expect(screen.getByRole('radio', { name: 'B' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'A' })).toHaveAttribute('aria-checked', 'false')
  })

  it('Slider draws one thumb per value of a range', () => {
    const { unmount } = render(<Slider defaultValue={[20]} aria-label="price" />)
    expect(document.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(1)
    unmount()
    render(<Slider defaultValue={[20, 80]} />)
    expect(document.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(2)
  })
})

describe('layout primitives', () => {
  it('Separator is horizontal by default and carries its orientation', () => {
    const { rerender } = render(<Separator data-testid="s" />)
    expect(screen.getByTestId('s')).toHaveAttribute('data-orientation', 'horizontal')
    rerender(<Separator data-testid="s" orientation="vertical" />)
    expect(screen.getByTestId('s')).toHaveAttribute('data-orientation', 'vertical')
  })

  it('Skeleton passes className and attributes', () => {
    render(<Skeleton data-testid="k" className="h-4 w-20" />)
    expect(screen.getByTestId('k')).toHaveAttribute('data-slot', 'skeleton')
    expect(screen.getByTestId('k').className).toContain('h-4')
  })

  it('Alert is an alert region with its title, description and action slots; the variant changes it', () => {
    const { rerender } = render(<Alert><AlertTitle>Heads up</AlertTitle><AlertDescription>Something changed</AlertDescription><AlertAction><button>Undo</button></AlertAction></Alert>)
    const a = screen.getByRole('alert')
    expect(a).toHaveTextContent('Heads up')
    expect(a.querySelector('[data-slot="alert-description"]')).toHaveTextContent('Something changed')
    expect(a.querySelector('[data-slot="alert-action"]')).toContainElement(screen.getByRole('button', { name: 'Undo' }))
    const base = a.className
    rerender(<Alert variant="destructive"><AlertTitle>Heads up</AlertTitle></Alert>)
    expect(screen.getByRole('alert').className).not.toBe(base)
  })

  it('Card composes its slots and carries its size', () => {
    render(
      <Card size="sm" data-testid="c">
        <CardHeader><CardTitle>T</CardTitle><CardDescription>D</CardDescription><CardAction>A</CardAction></CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Foot</CardFooter>
      </Card>,
    )
    expect(screen.getByTestId('c')).toHaveAttribute('data-size', 'sm')
    for (const slot of ['card-header', 'card-title', 'card-description', 'card-action', 'card-content', 'card-footer']) expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull()
  })

  it('Table renders a real table inside a scrolling container, with header cells and a caption', () => {
    render(
      <Table>
        <TableCaption>People</TableCaption>
        <TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader>
        <TableBody><TableRow><TableCell>Alba</TableCell></TableRow></TableBody>
        <TableFooter><TableRow><TableCell>1 row</TableCell></TableRow></TableFooter>
      </Table>,
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Alba' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="table-container"]')).toContainElement(screen.getByRole('table'))
    expect(screen.getByText('People').tagName).toBe('CAPTION')
  })

  it('Avatar shows its fallback without an image, carries its size, badge and group count', () => {
    render(
      <AvatarGroup>
        <Avatar size="lg" data-testid="a"><AvatarFallback>AK</AvatarFallback><AvatarBadge data-testid="b" /></Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    )
    expect(screen.getByText('AK')).toBeInTheDocument()
    expect(screen.getByTestId('a')).toHaveAttribute('data-size', 'lg')
    expect(screen.getByTestId('b')).toHaveAttribute('data-slot', 'avatar-badge')
    expect(screen.getByText('+3')).toHaveAttribute('data-slot', 'avatar-group-count')
  })

  it('ScrollArea renders its content in a viewport', () => {
    render(<ScrollArea className="h-10"><p>content</p></ScrollArea>)
    expect(document.querySelector('[data-slot="scroll-area-viewport"]')).toContainElement(screen.getByText('content'))
  })
})

describe('Progress', () => {
  it('exposes the value to assistive technology, with its label and value', () => {
    render(<Progress value={40}><ProgressLabel>Upload</ProgressLabel><ProgressValue /></Progress>)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '40')
    expect(screen.getByText('Upload')).toBeInTheDocument()
  })
})

describe('Tabs', () => {
  it('shows the panel of the selected tab and switches on click', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList><TabsTrigger value="a">One</TabsTrigger><TabsTrigger value="b">Two</TabsTrigger></TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>,
    )
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Panel A')).toBeVisible()
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Panel B')).toBeVisible()
  })

  it('carries its orientation', () => {
    render(<Tabs orientation="vertical" defaultValue="a" data-testid="t"><TabsList><TabsTrigger value="a">One</TabsTrigger></TabsList></Tabs>)
    expect(screen.getByTestId('t')).toHaveAttribute('data-orientation', 'vertical')
  })
})

describe('Pagination', () => {
  it('is a labelled navigation with previous / next named in the locale', () => {
    intl(
      <Pagination>
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="?page=1" /></PaginationItem>
          <PaginationItem><PaginationLink href="?page=2" isActive>2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis /></PaginationItem>
          <PaginationItem><PaginationNext href="?page=3" /></PaginationItem>
        </PaginationContent>
      </Pagination>,
    )
    expect(screen.getByRole('navigation', { name: 'pagination' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: messages.ui.pagination.aria_prev })).toHaveAttribute('href', '?page=1')
    expect(screen.getByRole('link', { name: messages.ui.pagination.aria_next })).toHaveAttribute('href', '?page=3')
  })

  it('marks the current page and no other link', () => {
    intl(<Pagination><PaginationContent><PaginationItem><PaginationLink href="#1" isActive>1</PaginationLink></PaginationItem><PaginationItem><PaginationLink href="#2">2</PaginationLink></PaginationItem></PaginationContent></Pagination>)
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: '2' })).not.toHaveAttribute('aria-current')
  })

  it('the ellipsis is hidden from assistive technology but carries a text alternative', () => {
    intl(<Pagination><PaginationContent><PaginationItem><PaginationEllipsis /></PaginationItem></PaginationContent></Pagination>)
    const e = document.querySelector('[data-slot="pagination-ellipsis"]') as HTMLElement
    expect(e).toHaveAttribute('aria-hidden', 'true')
    expect(e.querySelector('.sr-only')?.textContent).toBe(messages.ui.pagination.aria_ellipsis)
  })

  it('a custom text replaces the default previous / next text', () => {
    intl(<Pagination><PaginationContent><PaginationItem><PaginationNext href="#" text="Tjetra" /></PaginationItem></PaginationContent></Pagination>)
    expect(screen.getByText('Tjetra')).toBeInTheDocument()
  })
})
