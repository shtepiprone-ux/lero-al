# GR-7 — Task 923 Q10 (the cabinet e-mail change section), Opus, 2026-10-20

Library: docs/research/references/2026-10-04 (summary.md rows of the account, profile and form pages of each reference).
Live check in this session: gr7-email-section.mjs (10 pages x 1440, 390), gr7-tailadmin-modals.mjs (TailAdmin /profile dialogs operated),
gr7-computed.mjs (getComputedStyle of the comparable field, label, primary action and error). Raw output: the three .json files beside this note.
Every page answered 200; no page is UNVERIFIED. Kamr has no account-settings page in its inventory; its form pages are used.

What each reference shows for the subject (an e-mail field with a label, a password field, the primary action, the current e-mail):
- TailAdmin /profile: the current e-mail is a label above its value (Email address, then the value), the edit form is a dialog
- TailAdmin edit dialog at 390: every field label above its field, every field 302 px of a 302 px column (one column)
- TailAdmin edit dialog at 1440: two columns of 286 px fields, labels above
- Omah account/settings at 1440: labels left of the fields; at 390 the same labels move above the fields, fields 308 of 308 px
- Lahomes agents-add at 390: labels above, fields 310 of 310 px, the primary action Create Agent 350 of 360 px (full width)
- Lahomes auth-password at 390: one e-mail field with its label above and a full-width Reset Password action, 270 of 270 px
- Kamr form-validation at 1440: labels left; at 390 labels above, fields 334 of 334 px; the action Submit 70 px, not full width

Decision for lero.al (best 2026 practice among them, filled with lero.al data):
- every field has a visible label above it at every width (all four at 390; W3C Labels or Instructions); no placeholder-only field
- one column at every width, as the sibling password section; no 640 switch is needed
- the current e-mail is a label above its full value (TailAdmin /profile, owner decision D78-31: MantineDetailList)
- the primary action is full width (Lahomes at 390, and the sibling CabinetPasswordSectionView: one meaning, one look in one tab)
- the visual values are not taken from any reference: they are the theme's TextInput, PasswordInput, Button, Alert and MantineDetailList
