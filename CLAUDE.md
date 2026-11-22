# Lero.al agent entry point

Lero.al is an Albanian real-estate marketplace: Next.js App Router, Supabase (Postgres RLS, Auth, Storage), Mantine
(active migration from legacy Tailwind/shadcn), deployed on Vercel.

This file is the same for every Claude Code account (`claude`, `oclaude`, `sclaude`). The rules are the checklists
below, loaded into every session. Every model follows checklist A on every turn; Opus works through D (create a task),
V (review) and H (commands for the owner); Sonnet works through I (implement); U applies to visible UI. Each item is
done in full, in order, exactly as written (checklist A16): no model decides an item is unnecessary or "enough"; an
item that cannot be done stops the work as `BLOCKED: <the fact>`.

@.claude/rules/flow.md
@.claude/rules/checklists/common.md
@.claude/rules/checklists/design.md
@.claude/rules/checklists/execute.md
@.claude/rules/checklists/review.md
@.claude/rules/checklists/handoff.md
@.claude/rules/checklists/ui.md

Detail opened only for the item that names it: `.claude/rules/README.md` lists every rule file.
