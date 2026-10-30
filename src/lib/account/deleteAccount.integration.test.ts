/**
 * Real-boundary controls for Task 923 R141, R142 and owner decisions D30, D35: one complete deletion of an account. The REAL `hardDeleteUser` and `deleteOwnAccount` run
 * against REAL Supabase Auth, the REAL database and the REAL `avatars` Storage of the approved development project, after the owner applied deletion v4
 * (`db-catalog/proposed-account-deletion.sql`). The deletion itself is the real `deleteAccount`; `CLOUDINARY_DELETE_MODE` is stubbed to `dry-run`, so no Cloudinary file is destroyed
 * (the Cloudinary ids are real-looking but synthetic, and the reference check and the log are real). The doubles are the cookie-bound client factory (outside a Next request it
 * returns the client holding the REAL session of the chosen person), the request headers and cookies, the cache, and the mail senders.
 * Synthetic rows only (`zz_synth_<run>` names); the clean-up is verified and also removes what this file adds to the run's own fixtures (companies, contact inquiries and their
 * replies, reports, Storage objects). The two shared fixtures (the agent's and the moderator's) are built by the first case that needs them and deleted once; the cases that
 * share one read its outcome.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npx vitest run --config vitest.integration.config.ts src/lib/account/deleteAccount.integration.test.ts
 */
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { escapeLike } from '@/lib/postgrest/escape'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

vi.stubEnv('CLOUDINARY_DELETE_MODE', 'dry-run')

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('next/headers', () => ({ headers: async () => new Headers(), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))

import { hardDeleteUser } from '@/modules/admin/actions'
import { deleteOwnAccount } from '@/modules/cabinet/actions'

let run: Run
const NO_ID = '00000000-0000-0000-0000-000000000000'
const companyIds = new Set<string>()
const inquiryIds = new Set<string>()
const reportListingIds = new Set<string>()
const objectOwners = new Set<string>()

beforeAll(() => { run = createRun() })
afterAll(async () => {
  // what this file adds to the run's own fixtures goes first (the run's clean-up knows users, listings, inquiries, views, events, notifications and status history only)
  const admin = run.admin
  if (reportListingIds.size) await admin.from('listing_reports').delete().in('listing_id', [...reportListingIds])
  if (inquiryIds.size) {
    await admin.from('contact_inquiry_replies').delete().in('inquiry_id', [...inquiryIds])
    await admin.from('contact_inquiries').delete().in('id', [...inquiryIds])
  }
  await admin.from('contact_inquiries').delete().like('name', `${escapeLike(run.RUN)}%`)
  if (companyIds.size) await admin.from('companies').delete().in('id', [...companyIds])
  for (const owner of objectOwners) {
    const listed = await admin.storage.from('avatars').list(owner, { limit: 1000 })
    const left = (listed.data ?? []).map((object) => `${owner}/${object.name}`)
    if (left.length) await admin.storage.from('avatars').remove(left)
  }
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
  const strays = await Promise.all([
    admin.from('companies').select('id').in('id', companyIds.size ? [...companyIds] : [NO_ID]),
    admin.from('contact_inquiries').select('id').like('name', `${escapeLike(run.RUN)}%`),
  ])
  expect(strays.map((s) => s.error), 'the extra clean-up queries answered').toEqual([null, null])
  expect(strays.flatMap((s) => s.data ?? []), 'no company and no contact inquiry of this run is left').toEqual([])
  vi.unstubAllEnvs()
})

/**
 * A synthetic Cloudinary address inside the project's own cloud: the table `listing_images` accepts only `https://res.cloudinary.com/<the project's cloud>/` (check constraint
 * `listing_images_url_prefix_check`). The cloud name is the public part of every image address, so it is read from the prefix of an existing row (read only); the id after it
 * carries the run's prefix, names no real file, and with `CLOUDINARY_DELETE_MODE=dry-run` nothing at Cloudinary is touched.
 */
let cloudPrefix = ''
async function readCloudPrefix(): Promise<void> {
  if (cloudPrefix) return
  const { data, error } = await run.admin.from('listing_images').select('url').like('url', 'https://res.cloudinary.com/%').limit(1)
  expect(error, 'an existing image address is readable').toBeNull()
  const match = /^https:\/\/res\.cloudinary\.com\/[^/]+\//.exec((data?.[0] as { url?: string } | undefined)?.url ?? '')
  if (!match) throw new Error('the cloud prefix of the project cannot be read from an existing listing image (names only; no value is printed)')
  cloudPrefix = match[0]
}
const cloud = (name: string) => `${cloudPrefix}image/upload/v1700000000/${run.RUN}/${name}.jpg`

/** how many rows of `table` have `column` = `value` (a failed read fails the test: "unknown" is never "zero") */
async function count(table: string, column: string, value: string): Promise<number> {
  const { data, error } = await run.admin.from(table).select('id').eq(column, value)
  expect(error, `${table}.${column} is readable`).toBeNull()
  return data?.length ?? 0
}
const authUserOf = async (id: string) => (await run.admin.auth.admin.getUserById(id)).data?.user ?? null
const profileOf = async (id: string) => {
  const { data, error } = await run.admin.from('users').select('id, role, status, company_id').eq('id', id).maybeSingle()
  expect(error, 'the profile is readable').toBeNull()
  return data as { id: string; role: string; status: string; company_id: string | null } | null
}
async function named(person: SyntheticUser, name: string, lastName: string): Promise<string> {
  const updated = await run.admin.from('users').update({ name, last_name: lastName }).eq('id', person.id)
  expect(updated.error, `${person.id}: the synthetic name was stored`).toBeNull()
  return `${name} ${lastName}`
}
async function insert(table: string, row: Record<string, unknown>): Promise<string> {
  const { data, error } = await run.admin.from(table).insert(row).select('id').single()
  expect(error, `${table}: the synthetic row was inserted`).toBeNull()
  return (data as { id: string }).id
}

/** the fixture of SEC-DEL-INT-ALLOW and SEC-DEL-INT-OTHERS: an agent with everything, another owner, a second agent, and the administrator who deletes the agent */
interface AllowWorld {
  administrator: SyntheticUser
  agent: SyntheticUser
  agentName: string
  second: SyntheticUser
  owner: SyntheticUser
  agentListingId: string
  secondListingId: string
  ownerListingId: string
  companyId: string
  otherViewIds: string[]
  secondClickId: string
  inquiryId: string
  reportId: string
  answer: unknown
  /** the `[deleteAsset]` log entries of the deletion's own reason: what the REAL reference check answered for each Cloudinary id of the account (Task 923 R145 (e)) */
  fileEntries: { publicId: string; reason: string; outcome: string; lookup?: string }[]
}

async function buildAllowWorld(): Promise<AllowWorld> {
  await readCloudPrefix()
  const administrator = await run.makeUser('allow-admin', { role: 'admin' })
  const agent = await run.makeUser('allow-agent', { role: 'agent' })
  const second = await run.makeUser('allow-second-agent', { role: 'agent' })
  const owner = await run.makeUser('allow-owner', { role: 'user' })
  const agentName = await named(agent, `${run.RUN} Agent`, 'Synthetic')

  const agentListing = await run.makeListing(agent.id, 'active', 'allow-agent-listing')
  const secondListing = await run.makeListing(second.id, 'active', 'allow-second-listing')
  const ownerListing = await run.makeListing(owner.id, 'active', 'allow-owner-listing')
  // the agent's listing has image rows; the person has a favourite, a verification request with a document URL, and one Storage object under their id
  await insert('listing_images', { listing_id: agentListing.id, url: cloud('listing-one'), order: 0, is_cover: true })
  await insert('listing_images', { listing_id: agentListing.id, url: cloud('listing-two'), order: 1, is_cover: false })
  await insert('favorites', { user_id: agent.id, listing_id: ownerListing.id })
  await insert('favorites', { user_id: second.id, listing_id: ownerListing.id })
  await insert('verification_requests', { user_id: agent.id, document_url: cloud('verification') })
  objectOwners.add(agent.id)
  const uploaded = await run.admin.storage.from('avatars').upload(`${agent.id}/integration.txt`, new Blob(['synthetic']), { contentType: 'text/plain', upsert: true })
  expect(uploaded.error, 'the synthetic avatars object was written').toBeNull()

  // a counted view and a click of the agent on another owner's listing, and two views and a click that are not the agent's
  await insert('listing_views', { listing_id: ownerListing.id, user_id: agent.id, ip_hash: `${run.RUN}-a` })
  const otherViewIds = [
    await insert('listing_views', { listing_id: ownerListing.id, user_id: null, ip_hash: `${run.RUN}-b` }),
    await insert('listing_views', { listing_id: ownerListing.id, user_id: second.id, ip_hash: `${run.RUN}-c` }),
  ]
  const counted = await run.admin.from('listings').update({ views_count: 3 }).eq('id', ownerListing.id)
  expect(counted.error, 'the views count of the other listing is set to the three rows').toBeNull()
  const click = { listing_id: ownerListing.id, listing_owner_id: owner.id, channel: 'whatsapp', source: 'listing_detail_contact_card', is_owner_click: false }
  await insert('listing_contact_events', { ...click, actor_user_id: agent.id })
  const secondClickId = await insert('listing_contact_events', { ...click, actor_user_id: second.id })

  // a report and an inquiry on the other listing; the report names the agent (the trigger stores the name), the inquiry carries a typed name and e-mail
  reportListingIds.add(ownerListing.id)
  const reportId = await insert('listing_reports', { listing_id: ownerListing.id, user_id: agent.id, reason: 'spam', comment: `${run.RUN} report` })
  const inquiryId = await insert('listing_inquiries', {
    listing_id: ownerListing.id, listing_owner_id: owner.id, name: `${run.RUN} Inquirer`, email: 'zz-synthetic@example.com', message: 'synthetic inquiry',
  })

  // a company with created_by = the agent, and a second agent in it
  const companyId = await insert('companies', { name: `${run.RUN} Company`, logo_url: cloud('company-logo'), created_by: agent.id })
  companyIds.add(companyId)
  const members = await run.admin.from('users').update({ company_id: companyId }).in('id', [agent.id, second.id])
  expect(members.error, 'both agents belong to the company').toBeNull()

  acting.client = administrator.client
  // `deleteAsset` logs every outcome through console.info: the spy keeps the entries of this deletion and passes every call through; it is restored whatever happens
  const info = vi.spyOn(console, 'info')
  let answer: unknown
  let fileEntries: AllowWorld['fileEntries'] = []
  try {
    answer = await hardDeleteUser(agent.id)
  } finally {
    fileEntries = info.mock.calls
      .filter(([tag]) => tag === '[deleteAsset]')
      .map(([, entry]) => entry as AllowWorld['fileEntries'][number])
      .filter((entry) => entry.reason === 'account_deleted')
    info.mockRestore()
  }
  return {
    administrator, agent, agentName, second, owner, agentListingId: agentListing.id, secondListingId: secondListing.id, ownerListingId: ownerListing.id,
    companyId, otherViewIds, secondClickId, inquiryId, reportId, answer, fileEntries,
  }
}

/** the fixture of SEC-DEL-INT-STAFF and SEC-DEL-INT-STAFF-KEEP: a moderator whose actions left records, another user, and the administrator who deletes the moderator */
interface StaffWorld {
  administrator: SyntheticUser
  moderator: SyntheticUser
  moderatorName: string
  other: SyntheticUser
  inquiryId: string
  historyId: string
  replyId: string
  answer: unknown
}

async function buildStaffWorld(): Promise<StaffWorld> {
  const administrator = await run.makeUser('staff-admin', { role: 'admin' })
  const moderator = await run.makeUser('staff-moderator', { role: 'moderator' })
  const other = await run.makeUser('staff-other', { role: 'user' })
  const moderatorName = await named(moderator, `${run.RUN} Moderator`, 'Synthetic')
  // the moderator changed another synthetic user's status and replied to an inquiry before (the name triggers store the moderator's name when each row is written)
  const historyId = await insert('user_status_history', { user_id: other.id, old_status: 'active', new_status: 'inactive', reason: `${run.RUN} staff`, changed_by: moderator.id })
  const inquiryId = await insert('contact_inquiries', {
    topic: 'other', custom_subject: `${run.RUN} subject`, name: `${run.RUN} Contact`, email: 'zz-synthetic@example.com', message: 'a synthetic inquiry of the contact form',
    target_mailbox: 'zz-synthetic@example.com',
  })
  inquiryIds.add(inquiryId)
  const replyId = await insert('contact_inquiry_replies', { inquiry_id: inquiryId, replied_by: moderator.id, body: 'a synthetic reply' })
  acting.client = administrator.client
  return { administrator, moderator, moderatorName, other, inquiryId, historyId, replyId, answer: await hardDeleteUser(moderator.id) }
}

let allowPromise: Promise<AllowWorld> | undefined
let staffPromise: Promise<StaffWorld> | undefined
const allowWorld = () => (allowPromise ??= buildAllowWorld())
const staffWorld = () => (staffPromise ??= buildStaffWorld())

it('[SEC-DEL-INT-ALLOW] Deleting an account removes the account, its data, its listings and their files for every role, in one database transaction', async () => {
  const world = await allowWorld()
  expect(world.answer, 'the real hardDeleteUser answers').toEqual({})
  expect(await authUserOf(world.agent.id), 'the Auth user is gone').toBeNull()
  expect(await profileOf(world.agent.id), 'the profile is gone').toBeNull()
  expect(await count('listings', 'id', world.agentListingId), 'the listing is gone').toBe(0)
  expect(await count('listing_images', 'listing_id', world.agentListingId), 'its image rows are gone').toBe(0)
  expect(await count('favorites', 'user_id', world.agent.id), 'the favourite is gone').toBe(0)
  expect(await count('verification_requests', 'user_id', world.agent.id), 'the verification request is gone').toBe(0)
  const listed = await run.admin.storage.from('avatars').list(world.agent.id, { limit: 1000 })
  expect(listed.error, 'the avatars folder is readable').toBeNull()
  expect(listed.data ?? [], 'the avatars object is gone').toEqual([])

  // the files: each Cloudinary id of the account reached the REAL reference check once and passed it (a dry run, so nothing at Cloudinary was destroyed)
  for (const name of ['listing-one', 'listing-two', 'verification', 'company-logo']) {
    const publicId = `${run.RUN}/${name}`
    expect(world.fileEntries.filter((entry) => entry.publicId === publicId).length, `${name}: exactly one [deleteAsset] entry`).toBe(1)
  }
  expect(world.fileEntries.length, 'no other id was released').toBe(4)
  for (const entry of world.fileEntries) {
    expect(entry.outcome, `${entry.publicId}: the reference check passed and the dry run was logged`).toBe('DRY_RUN')
    expect(entry.lookup, `${entry.publicId}: no failed reference read`).toBeUndefined()
  }

  // the person's own statistics go and the other listing's count follows by exactly one
  expect(await count('listing_views', 'user_id', world.agent.id), 'the counted view is gone').toBe(0)
  expect(await count('listing_contact_events', 'actor_user_id', world.agent.id), 'the click is gone').toBe(0)
  const views = await run.admin.from('listings').select('views_count').eq('id', world.ownerListingId).single()
  expect(views.error, 'the views count is readable').toBeNull()
  expect((views.data as { views_count: number }).views_count, 'the other listing counts one view less (three rows were counted, one was the agent\'s)').toBe(2)

  // the report stays without the id and with the agent's name (D35); the inquiry stays
  const report = await run.admin.from('listing_reports').select('user_id, user_id_name').eq('id', world.reportId).maybeSingle()
  expect(report.error, 'the report is readable').toBeNull()
  expect(report.data, 'the report is kept, without the id and with the name').toEqual({ user_id: null, user_id_name: world.agentName })
  expect(await count('listing_inquiries', 'id', world.inquiryId), 'the inquiry is kept').toBe(1)

  // the company goes with its creator; the second agent stays, outside any company
  expect(await count('companies', 'id', world.companyId), 'the company is gone').toBe(0)
  expect((await profileOf(world.second.id))?.company_id, 'the second agent keeps their profile with no company').toBeNull()
})

it('[SEC-DEL-INT-OTHERS] Deleting an account removes the account, its data, its listings and their files for every role, in one database transaction', async () => {
  const world = await allowWorld()
  expect(world.answer, 'the deletion ran').toEqual({})
  expect(await profileOf(world.owner.id), 'the other owner is still there').toMatchObject({ id: world.owner.id })
  expect(await authUserOf(world.owner.id), 'the other owner\'s Auth user is still there').not.toBeNull()
  expect(await count('listings', 'id', world.ownerListingId), 'their listing is still there').toBe(1)
  const remaining = await run.admin.from('listing_views').select('id').eq('listing_id', world.ownerListingId)
  expect(remaining.error).toBeNull()
  expect((remaining.data ?? []).map((row) => (row as { id: string }).id).sort(), 'the other two views stay').toEqual([...world.otherViewIds].sort())
  const views = await run.admin.from('listings').select('views_count').eq('id', world.ownerListingId).single()
  expect((views.data as { views_count: number }).views_count, 'no other count was lowered: the listing went from 3 to 2, not further').toBe(2)
  expect(await count('listing_contact_events', 'id', world.secondClickId), 'the other click stays').toBe(1)

  expect(await authUserOf(world.second.id), 'the second agent\'s Auth user is still there').not.toBeNull()
  expect(await profileOf(world.second.id), 'the second agent is still there').toMatchObject({ id: world.second.id, role: 'agent' })
  expect(await count('listings', 'id', world.secondListingId), 'the second agent\'s listing is still there').toBe(1)
  expect(await count('favorites', 'user_id', world.second.id), 'the second agent\'s favourite is still there').toBe(1)
  expect(await profileOf(world.administrator.id), 'the administrator who deleted is untouched').toMatchObject({ id: world.administrator.id, role: 'admin' })
})

it('[SEC-DEL-INT-STAFF] A deleted staff member leaves the records of their actions with their name and without their id', async () => {
  const world = await staffWorld()
  expect(world.answer, 'the deletion succeeds: no foreign key refuses it').toEqual({})
  expect(await authUserOf(world.moderator.id), 'the moderator\'s Auth user is gone').toBeNull()
  expect(await profileOf(world.moderator.id), 'the moderator\'s profile is gone').toBeNull()
  const history = await run.admin.from('user_status_history').select('changed_by, changed_by_name').eq('id', world.historyId).maybeSingle()
  expect(history.error, 'the history row is readable').toBeNull()
  expect(history.data, 'the status history row keeps the name and has no id').toEqual({ changed_by: null, changed_by_name: world.moderatorName })
  const reply = await run.admin.from('contact_inquiry_replies').select('replied_by, replied_by_name').eq('id', world.replyId).maybeSingle()
  expect(reply.error, 'the reply is readable').toBeNull()
  expect(reply.data, 'the reply keeps the name and has no id').toEqual({ replied_by: null, replied_by_name: world.moderatorName })
})

it('[SEC-DEL-INT-STAFF-KEEP] A deleted staff member leaves the records of their actions with their name and without their id', async () => {
  const world = await staffWorld()
  expect(world.answer, 'the deletion ran').toEqual({})
  expect(await profileOf(world.other.id), 'the other user is not deleted and not changed').toMatchObject({ id: world.other.id, role: 'user', status: 'active' })
  expect(await count('user_status_history', 'id', world.historyId), 'the status history row is not deleted').toBe(1)
  expect(await count('contact_inquiries', 'id', world.inquiryId), 'the inquiry the reply belongs to is not deleted').toBe(1)
  expect(await count('contact_inquiry_replies', 'id', world.replyId), 'the reply is not deleted').toBe(1)
  expect(await profileOf(world.administrator.id), 'the administrator who deleted is untouched').toMatchObject({ id: world.administrator.id, role: 'admin' })
})

it('[SEC-DEL-INT-DENY] Only the person or a staff member whose rank allows it can delete an account', async () => {
  const moderator = await run.makeUser('deny-moderator', { role: 'moderator' })
  const administrator = await run.makeUser('deny-admin', { role: 'admin' })
  const listing = await run.makeListing(administrator.id, 'active', 'deny-admin-listing')
  // Task 923 R166: the moderator holds users.hard_delete for this case, so the rank rule is the layer that refuses: a moderator never deletes an administrator.
  const stored = await run.admin.from('role_permissions').select('*').eq('role', 'moderator').eq('permission_key', 'users.hard_delete').maybeSingle()
  expect(stored.error, 'the stored switch of users.hard_delete is readable').toBeNull()
  const switched = await run.admin.from('role_permissions').upsert({ role: 'moderator', permission_key: 'users.hard_delete', allowed: true }, { onConflict: 'role,permission_key' })
  expect(switched.error, 'the switch users.hard_delete is set to true for this case').toBeNull()
  try {
    acting.client = moderator.client
    expect(await hardDeleteUser(administrator.id), 'a moderator deleting an administrator').toEqual({ error: 'forbidden' })
    acting.client = run.anonymousClient()
    expect(await deleteOwnAccount({ password: 'Wrong-Passw0rd!' }), 'an anonymous client deleting an account').toEqual({ error: 'Unauthorized' })

    expect(await authUserOf(administrator.id), 'the administrator\'s Auth user is unchanged').not.toBeNull()
    expect(await profileOf(administrator.id), 'the administrator\'s profile is unchanged').toMatchObject({ id: administrator.id, role: 'admin', status: 'active' })
    expect(await count('listings', 'id', listing.id), 'the administrator\'s listing is unchanged').toBe(1)
    expect(await authUserOf(moderator.id), 'the moderator\'s Auth user is unchanged').not.toBeNull()
    expect(await profileOf(moderator.id), 'the moderator\'s profile is unchanged').toMatchObject({ id: moderator.id, role: 'moderator', status: 'active' })
  } finally {
    // the stored switch goes back exactly as it was (or the row is removed when none was stored)
    const restored = stored.data
      ? await run.admin.from('role_permissions').upsert(stored.data, { onConflict: 'role,permission_key' })
      : await run.admin.from('role_permissions').delete().eq('role', 'moderator').eq('permission_key', 'users.hard_delete')
    expect(restored.error, 'the stored switch of users.hard_delete is restored').toBeNull()
  }
})

it('[SEC-DEL-INT-SELF] Only the person or a staff member whose rank allows it can delete an account', async () => {
  const person = await run.makeUser('self-person', { role: 'user' })
  const bystander = await run.makeUser('self-bystander', { role: 'user' })
  const own = await run.makeListing(person.id, 'active', 'self-listing')
  const bystanderListing = await run.makeListing(bystander.id, 'active', 'self-bystander-listing')

  acting.client = person.client
  expect(await deleteOwnAccount({ password: person.password }), 'the person deletes their own account with their password').toEqual({})
  expect(await authUserOf(person.id), 'the Auth user is gone').toBeNull()
  expect(await profileOf(person.id), 'the profile is gone').toBeNull()
  expect(await count('listings', 'id', own.id), 'the listing is gone').toBe(0)

  expect(await authUserOf(bystander.id), 'another account\'s Auth user is not touched').not.toBeNull()
  expect(await profileOf(bystander.id), 'another account is not touched').toMatchObject({ id: bystander.id, role: 'user' })
  expect(await count('listings', 'id', bystanderListing.id), 'another account\'s listing is not touched').toBe(1)
})
