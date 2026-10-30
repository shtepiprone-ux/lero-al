// Task 923 Revision 33 design (Opus, 2026-10-22): inserts claim rows C978–C1044 after C977 and section 57 before "## Security test contract" in the Task 923
// kickoff, extends the Mobile adaptation record with R113's surfaces, and notes Revision 33 in the security contract's "Cases" row. Keeps the file's line
// endings. Idempotent. Usage: node r33d-17-kickoff-insert.mjs <kickoff> <claim rows file> <section file>
import fs from 'node:fs'

const [kickoff, rowsFile, sectionFile] = process.argv.slice(2)
const raw = fs.readFileSync(kickoff, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
let text = raw.replace(/\r\n/g, '\n')
const rows = fs.readFileSync(rowsFile, 'utf8').replace(/\r\n/g, '\n').trimEnd()
const section = fs.readFileSync(sectionFile, 'utf8').replace(/\r\n/g, '\n').trimEnd()

if (!text.includes('\n| C978 |')) {
  const at = text.indexOf('\n| C977 |')
  if (at < 0) throw new Error('C977 row not found')
  const end = text.indexOf('\n', at + 1)
  text = text.slice(0, end) + '\n' + rows + text.slice(end)
}
if (!text.includes('\n## 57. Review 36 and Revision 33')) {
  const at = text.indexOf('\n## Security test contract\n')
  if (at < 0) throw new Error('security contract heading not found')
  text = text.slice(0, at + 1) + section + '\n\n' + text.slice(at + 1)
}

// The Mobile adaptation record: each field line gains R113's values once.
const RECORD = [
  ['- Surfaces: ', '; src/modules/listings/components/ListingContact.tsx with src/design-system/mantine/patterns/MantineListingContactPattern.tsx — the contact card\'s human check below Call and WhatsApp (R113); src/modules/listings/components/ListingInquiryDialogView.tsx — the message dialog\'s human check after the message field (R113); src/components/auth/CaptchaWidget.tsx — the on-demand compact human check (R113)'],
  ['- Component families: ', ', media-gallery-and-listing-contact'],
  ['- Pattern IDs: ', ', inline-control'],
  ['- Standards: ', ', w3c-target-size, apple-hig-menus'],
  ['- Mantine owner: ', ', src/design-system/mantine/patterns/MantineListingContactPattern.tsx, src/design-system/mantine/patterns/MantineAuthFormPattern.tsx'],
  ['- Mobile range and switches: ', ' The human check (R113) has no threshold of its own: it takes no space until Cloudflare asks for interaction, then shows Cloudflare\'s compact 150 × 140 box at every width (the contact card is 246px wide at 320, C1029).'],
  ['- Mobile order: ', ' — contact card (R113): agent; price; Call, WhatsApp; the human check when shown; Send message; save; report — message dialog (R113): name; e-mail; message; the human check when shown; Cancel then Send'],
  ['- Story and verification: ', '; for R113 src/stories/patterns/mantine/ListingContactPattern.stories.tsx, src/stories/patterns/mantine/ListingInquiryDialogView.stories.tsx and src/stories/patterns/mantine/AuthSheet.stories.tsx Captcha, all unchanged, and the route on the local site at 320, 360, 390, 639, 640, 1024 and 1440 in sq, en, uk and it (§57, r33-08)'],
]
const recordStart = text.indexOf('\n## Mobile adaptation record\n')
const recordEnd = text.indexOf('\n## ', recordStart + 5)
if (recordStart < 0 || recordEnd < 0) throw new Error('Mobile adaptation record not found')
let record = text.slice(recordStart, recordEnd)
for (const [prefix, addition] of RECORD) {
  const at = record.indexOf('\n' + prefix)
  if (at < 0) throw new Error('record field not found: ' + prefix)
  const end = record.indexOf('\n', at + 1)
  const line = record.slice(at + 1, end)
  if (line.includes(addition.trim().slice(0, 40))) continue
  record = record.slice(0, end) + addition + record.slice(end)
}
text = text.slice(0, recordStart) + record + text.slice(recordEnd)

const casesAnchor = 'adds `listingSemanticHelpers.ts` and `listingDomain.test.ts` to the scope (305 paths); the counts are unchanged. |'
const casesAdd = 'adds `listingSemanticHelpers.ts` and `listingDomain.test.ts` to the scope (305 paths); the counts are unchanged. Revision 33 (§57) amends the R86 cases for the gateway (`contactGateway.ts`), the toast refusal and v8a\'s service-role function, and adds SEC-X-SRV-CONTACT-SESSION-DENY (critical), SEC-X-SRV-CONTACT-ENTRY, SEC-X-INT-CONTACT-SESSION-DENY and SEC-X-INT-CONTACT-GATEWAY: 213 cases, 64 critical; the scope gains every R110–R114 path. |'
if (!text.includes('Revision 33 (§57) amends')) {
  if (text.split(casesAnchor).length !== 2) throw new Error('cases anchor not unique')
  text = text.replace(casesAnchor, casesAdd)
}
fs.writeFileSync(kickoff, text.replace(/\n/g, eol))
console.log('kickoff updated')
