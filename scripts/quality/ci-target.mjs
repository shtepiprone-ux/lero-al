#!/usr/bin/env node
// Refuses to run CI tests that create and delete rows unless the configured Supabase project is the approved
// development project (OWASP Database Security: separate databases for development and production;
// CI/CD Security: least privilege for pipeline credentials). Usage: node scripts/quality/ci-target.mjs

const env = process.env;
const ref = env.SECURITY_TEST_PROJECT_REF || '';
const errors = [];

if (env.SECURITY_TEST_TARGET !== 'development' || !/^[a-z0-9]{20}$/.test(ref)) {
  errors.push('SECURITY_TEST_TARGET=development and a 20-character SECURITY_TEST_PROJECT_REF are required');
} else {
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    if (url.protocol !== 'https:' || url.hostname !== `${ref}.supabase.co` || url.username || url.password) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not the approved development project');
    }
  } catch {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing or invalid');
  }
}
for (const name of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!env[name]) errors.push(`${name} is missing`);
}

for (const error of errors) console.error(`::error::${error}`);
process.exit(errors.length ? 1 : 0);
