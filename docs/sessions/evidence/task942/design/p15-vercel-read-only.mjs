// Task 942 revision 7, prototype of owner decision D31: the Vercel MCP write tools refused. Classifies every tool the session offers (vercel-mcp-tools.txt) by the deny patterns
// and by the read rule of the hook. Run from the repository root. Read-only.
import { readFileSync } from 'node:fs';
const PREFIX = 'mcp__plugin_vercel_vercel__';
const names = readFileSync('docs/sessions/evidence/task942/design/vercel-mcp-tools.txt', 'utf8').split(/\r?\n/).filter(Boolean);
const DENY = ['accept_', 'activate_', 'add_', 'approve_', 'assign_', 'authorize_', 'buy_', 'cancel_', 'change_', 'complete_', 'create_', 'delete_', 'edit_', 'extend_', 'generate_', 'invalidate_', 'issue_', 'kill_', 'patch_', 'pause_', 'put_', 'record_', 'replace_', 'reply_', 'request_', 'rerequest_', 'restore_', 'retry_', 'revoke_', 'run_', 'stage_', 'start_', 'stop_', 'submit_', 'test_', 'unpause_', 'update_', 'upload_', 'upsert_', 'verify_', 'write_'].map(verb => `${verb}*`).concat(['get_access_to_vercel_url', 'get_or_create_drive', 'get_project_deletion_link', 'get_flags_project_disconnection_link']);
const denied = name => DENY.some(rule => rule.endsWith('*') ? name.startsWith(rule.slice(0, -1)) : name === rule);
// The hook: a name is allowed only when it matches a read form and no deny pattern; anything else, a tool that does not exist yet included, is refused.
const READ = /^(?:get|list|count|aggregate|search|read|filter)_|^(?:artifact_query|git_namespaces|web_fetch_vercel_url)$/;
const hookAllows = name => READ.test(name) && !denied(name);
const by = name => (denied(name) ? 'deny' : hookAllows(name) ? 'read' : 'NEITHER');
const groups = { deny: [], read: [], NEITHER: [] };
for (const name of names) groups[by(name)].push(name);
console.log(`tools ${names.length}; denied ${groups.deny.length}; readable ${groups.read.length}; neither ${groups.NEITHER.length}`);
console.log(`every deny pattern used: ${DENY.every(rule => names.some(name => rule.endsWith('*') ? name.startsWith(rule.slice(0, -1)) : name === rule))}`);
const WRITES = ['create_deployment', 'request_promote', 'request_rollback', 'create_project_env', 'edit_project_env', 'update_firewall_config', 'put_firewall_config', 'create_record', 'update_record', 'replace_domain_dns_records', 'buy_domain', 'pause_project', 'update_project', 'upload_file', 'run_session_command', 'get_or_create_drive'];
console.log(`named writes all refused: ${WRITES.every(name => !hookAllows(name) && denied(name))}`);
const READS = ['get_runtime_logs', 'get_runtime_errors', 'list_deployments', 'get_deployment', 'get_project', 'search_vercel_documentation', 'get_auth_user', 'list_project_routes'];
console.log(`named reads all allowed: ${READS.every(hookAllows)}`);
console.log(`a tool that does not exist yet, future_wipe_everything, hook allows: ${hookAllows('future_wipe_everything')}`);
const matcher = /Edit|Write|Bash|PowerShell|mcp__plugin_vercel_vercel__.*/;
console.log(`the hook matcher sees ${PREFIX}create_deployment: ${matcher.test(`${PREFIX}create_deployment`)}; sees mcp__plugin_playwright_playwright__browser_click: ${matcher.test('mcp__plugin_playwright_playwright__browser_click')}`);
console.log(`reads that return a secret stay readable, outside D31: ${['get_project_env', 'filter_project_envs', 'get_shared_env_var', 'get_edge_config_token', 'get_edge_config_tokens'].filter(hookAllows).join(', ')}`);
console.log('deny entries:');
console.log(JSON.stringify(DENY.map(rule => `${PREFIX}${rule}`)));
