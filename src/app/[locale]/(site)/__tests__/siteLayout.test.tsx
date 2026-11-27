// @vitest-environment node
/**
 * Task 988 R6-3 (F13): the site layout holds what only the site renders, moved unchanged out of the locale layout: the site title, the session's user handed to
 * `AuthProvider`, and the frame (header, `main` with the page, footer and the three performance components). The components are named doubles; the layout's
 * element tree is read, nothing is rendered.
 */
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

const session = vi.hoisted(() => ({ user: { id: 'user-1' } as unknown }))
vi.mock('@/lib/auth/server', () => ({ resolveSession: async () => ({ user: session.user }) }))
vi.mock('@/modules/auth/context/AuthContext', () => ({ AuthProvider: function AuthProvider() { return null } }))
vi.mock('@/components/layout/Header', () => ({ Header: function Header() { return null } }))
vi.mock('@/components/layout/Footer', () => ({ Footer: function Footer() { return null } }))
vi.mock('@/components/shared/WebVitalsReporter', () => ({ WebVitalsReporter: function WebVitalsReporter() { return null } }))
vi.mock('@/components/shared/PerformanceStoreInit', () => ({ PerformanceStoreInit: function PerformanceStoreInit() { return null } }))
vi.mock('@/components/shared/PerfDevOverlay', () => ({ PerfDevOverlay: function PerfDevOverlay() { return null } }))
// Task 989: the title comes from the settings; with none saved it is today's text
vi.mock('@/modules/admin/lib/settings', () => ({ getSettings: async () => ({}) }))

import SiteLayout, { generateMetadata } from '../layout'
import { AuthProvider } from '@/modules/auth/context/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WebVitalsReporter } from '@/components/shared/WebVitalsReporter'
import { PerformanceStoreInit } from '@/components/shared/PerformanceStoreInit'
import { PerfDevOverlay } from '@/components/shared/PerfDevOverlay'

type Node = { type: unknown; props: { component?: string; children?: unknown } }

describe('SiteLayout — the site frame (Task 988)', () => {
  it('keeps the site title', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) })
    expect(metadata.title).toBe('Lero.al — Real estate marketplace in Albania')
  })

  it('hands the session\'s user to AuthProvider', async () => {
    const tree = await SiteLayout({ children: <p>child</p> })
    expect(tree.type).toBe(AuthProvider)
    expect(tree.props.initialUser).toBe(session.user)
  })

  it('renders the header, a main with the page, the footer and the three performance components, in that order', async () => {
    const child = <p>child</p>
    const tree = await SiteLayout({ children: child })
    const frame = (tree.props.children as { props: { children: Node[] } }).props.children.filter(Boolean)
    const named = new Map<unknown, string>([[Header, 'Header'], [Footer, 'Footer'], [WebVitalsReporter, 'WebVitalsReporter'], [PerformanceStoreInit, 'PerformanceStoreInit'], [PerfDevOverlay, 'PerfDevOverlay']])
    expect(frame.map((node) => named.get(node.type) ?? node.props.component))
      .toEqual(['Header', 'main', 'Footer', 'WebVitalsReporter', 'PerformanceStoreInit', 'PerfDevOverlay'])
    expect(frame[1].props.children).toBe(child)
  })
})
