## GR-8 — One table anatomy: checkboxes, then content, then edit/delete

**Owner rule, 2026-10-04.** The owner returned Task 859 and wrote: *"I see that the tables in the admin panel are all different. There is
no single table style where the checkbox column comes first, then the content columns
of the table, and after the content the columns with the edit and delete
options. I wrote about this literally yesterday, and today I see this mismatch again!"* Then: *"yesterday I told you to create a rule about tables and that you must
check the references I gave you yesterday, always … check them before writing."*

**Why this rule exists.** On 2026-10-03 the request became Task 919's kickoff and decisions D78-13…D78-16, and no
rule. Opus then narrowed it twice:
- 919 covers six tables;
- the D78-15 option Opus wrote left out support tickets because the server has no delete action.

The same day, 859's revision gave `/admin/support` a table without the anatomy. 916's five legacy managers, email
templates and inquiries were bound by nothing, or by a later task.

**Applies to:** every table of stored records in new or migrated UI. That means admin first, and every table in the
project (owner, 2026-10-02: *"and this applies to all tables in the project, not only in the admin panel"*). Two cases are not
settled: a table whose rows are computed, not stored (statistics, dashboards), and a card-list layout of records (for
example inquiries). Each is an **open owner decision**. Until the owner decides, a kickoff touching one stops there
with bounded options.

**Required anatomy, in this order:**
1. **The first column is a row checkbox**, with select-all in the header.
2. **Then the content columns.**
3. **The last column is the row actions:** edit, then delete. Any other per-entity action goes in the same group, before
   them. The look is owner D78-14, Lahomes tinted.
4. **Bulk delete** is an icon button at the end of the filter row. It appears once a row is selected.
5. **Delete always asks for confirmation** in the canonical confirm modal.
6. **Below the card breakpoint,** the checkbox and the actions row stay on every card.

The chrome lives in one canonical owner, `MantineDataTableToCards` (built by 919). A table never builds its own
checkbox column or action icons.

**Forbidden:**
- a kickoff, revision, implementation or approval that leaves a table in scope without the anatomy;
- a scope line, exclusion or AskUserQuestion option that drops a table from it, for any reason. Two examples are "no
  delete action on the server" and "a later task". A missing server action is a lero.al data-map gap under GR-7.
  The kickoff adds the action, or puts bounded options to the owner;
- feature-local checkbox, action-icon or confirm chrome.

**References first.** Every table decision is preceded by the full GR-7 audit: every page of all four references, in
depth, in the current session, by the role making the decision. The chosen anatomy is the best 2026 practice among
what they show. A kickoff that only cites an earlier session's research is not publishable.

**Check, at task design and review:** list every table the touched surfaces render, and give each one a receipt. At
review, verify the column order in the rendered Story at 1440 and the card at 390.

**Receipt — task design, execution and review alike, one per table:**

`GR-8 TABLE ANATOMY — <surface/table>: checkbox column first + select-all <yes | no>; actions column last <edit, delete, …>; bulk delete in the filter row <yes | no>; delete confirm <canonical modal | no>; cards keep checkbox + actions <yes | no>; exception: <owner decision ID with date | NONE>.`

With no receipt, or with a `no` and no owner exception, the kickoff is not publishable, the executor returns
`BLOCKED — GR-8`, and the reviewer returns `NEEDS REVISION`. No gate measures this yet (GR-2).

