# Claude Code permission rules, read for Task 942 revision 7

Read on 2026-11-05 from https://code.claude.com/docs/en/permissions and the hooks page it links, through the web-fetch agent. Quoted as read.

- Deny and ask rules also accept glob patterns in the tool-name position. The pattern must match the full tool name.
- Deny rules block in every mode, including bypassPermissions. Auto mode is not named in that sentence.
- It skips any mcp__ rule that has parentheses.
- A PreToolUse matcher such as mcp__plugin_<plugin>_<server>__.* is a JavaScript regular expression.
- A hook can refuse a call with hookSpecificOutput and permissionDecision deny, or by exit code 2.

What was not read there and is proven only by the live check of AC15: that a rule of this form refuses a Vercel tool in the Claude Code version the project runs.
