#!/usr/bin/env bash
# Task 938 design: CI-equivalent local reproduction of the Click-Shield job (governance-pr.yml "click-shield").
# CI builds and starts with ONLY NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (+ SUPABASE_SERVICE_ROLE_KEY at start)
# and CLICK_SHIELD_CI_FIXTURE=1; locally Next would also load .env.local (about 30 more variables). Setting
# __NEXT_PROCESSED_ENV=true makes @next/env skip every .env file without touching .env.local. The three values are read
# from .env.local by node and passed only through the environment; nothing is printed. Same Supabase project ref as CI
# (vars.SECURITY_TEST_PROJECT_REF = bmxkzcxaojgmpgzawwtn).
# Precondition: no server is serving .next (this rebuilds .next) and port 3102 is free.
# Usage (Git Bash, repo root): bash docs/sessions/evidence/task938/design/p02-ci-equivalent-repro.sh
set -euo pipefail
OUT=docs/sessions/evidence/task938/design/p02-ci-equivalent-repro.txt
val() { node -e "const t=require('fs').readFileSync('.env.local','utf8');const m=t.match(new RegExp('^'+process.argv[1]+'=(.*)$','m'));process.stdout.write(m?m[1].trim().replace(/^[\"']|[\"']$/g,''):'')" "$1"; }
URL=$(val NEXT_PUBLIC_SUPABASE_URL); ANON=$(val NEXT_PUBLIC_SUPABASE_ANON_KEY); SRK=$(val SUPABASE_SERVICE_ROLE_KEY)
CLEAN=(env -i "PATH=$PATH" "HOME=${HOME:-}" "SYSTEMROOT=${SYSTEMROOT:-}" "TEMP=${TEMP:-}" "TMP=${TMP:-}" "APPDATA=${APPDATA:-}" "LOCALAPPDATA=${LOCALAPPDATA:-}" "USERPROFILE=${USERPROFILE:-}" __NEXT_PROCESSED_ENV=true CLICK_SHIELD_CI_FIXTURE=1 "NEXT_PUBLIC_SUPABASE_URL=$URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON")
{ echo "Task 938 CI-equivalent reproduction, $(date -u +%FT%TZ), HEAD $(git rev-parse --short HEAD), node $(node -v)"
  echo "## build (env: 2 Supabase vars + CLICK_SHIELD_CI_FIXTURE, .env files skipped)"
  "${CLEAN[@]}" npx next build 2>&1 | grep -E "sitemap|Compiled|Error|error" | head -20
  echo "## start on 3102 (env: + SUPABASE_SERVICE_ROLE_KEY)"
} > "$OUT"
"${CLEAN[@]}" "SUPABASE_SERVICE_ROLE_KEY=$SRK" npx next start -p 3102 > docs/sessions/evidence/task938/design/p02-server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
for i in $(seq 1 30); do curl -sf -o /dev/null http://127.0.0.1:3102/ && break; sleep 2; done
{ echo "## networkidle probe /sq (same wait as check-click-shield.mjs)"
  node docs/sessions/evidence/task938/design/p01-networkidle-probe.mjs http://127.0.0.1:3102 /sq 2>&1
  echo "## gate"
  BASE_URL=http://127.0.0.1:3102 node scripts/check-click-shield.mjs 2>&1 | grep -E "Summary|Scenarios:|❌|\[base\] cells|\[drawer\] cells|\[modal\] cells" | head -40
} >> "$OUT"
echo "written: $OUT"
