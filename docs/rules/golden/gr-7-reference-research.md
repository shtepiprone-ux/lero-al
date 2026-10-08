## GR-7 — Every task, at every step, by every role: audit all four references in depth, then use only the best UI/UX practice of 2026

**Owner rule, 2026-10-03.** The owner asked for row checkboxes, a bulk-delete button and per-row edit/delete icons in
every table, and wrote, verbatim: *"Я бачу, що ти взагалі тупо не дослідив проект референсу, просто навмання пишеш
задачі, авось проканає. … Так от, відтепер ти досконало вивчаєш референси, співставляєш UI/UX з нашими даними у
проекті lero.al і тільки потім пишеш задачу. Пропиши це у правило!"* … *"Шукаєш найкращий UI/UX візуал, підставляєш
наші дані, і тільки потім пишеш задачу для Sonet!"*

**Restated and widened by the owner, 2026-10-04, verbatim:** *"обов'язково, обов'язково …, і тільки спробуй пропустити
перед створенням кожної задачі, перед виконанням кожної задачі, перед рев'ю кожної задачі - ти (як оркестратор,
архітектор, дизайнер, рев'ювер, QA) і Sonnet (як виконавець) маєте завжди (обов'язково!) перевіряти референси та всі
стоірнки на цих референсах (детальний аналіз, а не поверхневий!)"* and *"Обов'язкове правило - завжди використовувати
тільки найкращі UI/UX практики 2026 року!"* The 2026-10-03 version had three defects. It named three references, not
four. It bound only task design and review, so Sonnet never ran it. And it let Opus decide which tasks "rely on a
reference".

**Standing references. Every page of each, with no exception:**
1. Lahomes — https://techzaa.in/lahomes/admin/index.html
2. Kamr — https://kamr-vite.vercel.app/dashboard (login `demo@example.com`, password `123456`: the public demo account, corrected by the owner on
   2026-10-04; the earlier `admin` login is refused by the form's `type="email"` field)
3. Omah — https://omah.dexignzone.com/xhtml/index.html
4. TailAdmin — https://demo.tailadmin.com/ (the bundled copy, `docs/tailadmin-style-reference.md`, is supplementary and
   never replaces the live site)

**When it runs. Every task, three times, no exemptions:**

| Moment | Who | Before what |
|---|---|---|
| Task creation, including every revision and every `NEEDS REVISION` amendment | Opus (orchestrator, architect, designer) | the first line of the kickoff or revision, and before any AskUserQuestion option |
| Task execution | Sonnet (executor) | the first write of the task |
| Task review, including QA and owner-matrix handoff | Opus (reviewer, QA) | the first finding or verdict |

- **Shared reference library. Owner decision 2026-10-04, options chosen verbatim:** *"One shared library
  (Recommended)"* and *"Git: JSON only (Recommended)"*.
  - **The library.** The full audit of all four references (every page, in depth) is stored once in
    `docs/research/references/<YYYY-MM-DD>/`: `audit-<ref>.json`, `summary.md` (one evidence row per page),
    `summary.json` and the crawler `gr7-deep.mjs`. The newest dated folder is the current library.
  - **Git.** The JSON, the summary and the scripts are committed. The full-page screenshots (`shots-*/`) stay on disk
    and are git-ignored. A screenshot that a kickoff or review cites is copied into that task's evidence folder and
    committed there.
  - **At every moment** (task creation, execution, review), the role reads the current library's rows for the task's
    subject in every reference. It then opens **live, in its own session**, every reference page it relies on, re-operates
    the relevant controls, and records `unchanged` or the difference. It also opens any reference page the library is
    missing.
  - **A full re-crawl** (a new dated folder) runs when a live check finds a difference, a page is missing, the owner adds
    a reference, or the owner asks for one.
  - The library replaces the per-task full crawl, but never the live check: a library row alone is not evidence for a
    decision.
- "This task has no UI", "it is a governance task" and "the reference has no such feature" are not exemptions. The
  audit runs, and the record states what each reference shows for the task's subject, or that it shows nothing.
- Only the owner can narrow this rule, by a dated, verbatim decision.

**In depth, not on the surface.** A page counts as inspected only when its record has all of the following:
- the URL, and how it was reached;
- a full-page screenshot;
- every control on it that the task's subject touches, operated (open, select, submit, cancel, the hover and focus
  states);
- the anatomy observed: layout, order, labels, states;
- `getComputedStyle` values (size, radius, colour, gap) for every element comparable to the task's subject.

A link list, a landing page, a sample of pages, a count of "pages crawled", or a summary is not an audit. Task 919's
2026-10-03 research opened 43 of 88 TailAdmin links, 17 of 120 Lahomes links and 15 of 61 Kamr links. It is the
example of what fails this rule.

**Best UI/UX practice of 2026: mandatory.** Every UI/UX choice — layout, control, interaction, feedback,
accessibility, responsive behaviour, visual value — is the best current (2026) practice among what the four
references show, filled with lero.al's real data. Where the references differ, the record names each option, the
reference pages that show it, and why the chosen one is the 2026 best practice. Examples of such reasons: WCAG 2.2 AA,
a touch target ≥ 44px, a visible focus state, confirmation before a destructive action, no horizontal scroll, and
consistency with lero.al's existing canonical pattern. A choice made for convenience, from memory, or because one
reference happened to be opened first is forbidden.

