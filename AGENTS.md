# Codex startup rule

Before opening task files or making changes, read `.codex/RULES.md` and follow it.

# Every AI tool

The flow of writing and checking code is `.claude/rules/shared/secure-code-review.md`. The automatic checks run by hook only
inside Claude Code: any other tool that writes code runs `node scripts/workflow-gates/change-review.mjs --base=HEAD` before
it calls the change finished, fixes what it refuses, and answers every line of its report. CI runs the same review.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
