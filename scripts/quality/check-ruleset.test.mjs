// node --test scripts/quality/check-ruleset.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareRuleset } from './check-ruleset.mjs';

const expected = JSON.parse(readFileSync(new URL('./main-ruleset.json', import.meta.url), 'utf8'));
const clone = (x) => JSON.parse(JSON.stringify(x));

test('a live ruleset equal to the payload (plus GitHub defaults and ids) has no drift', () => {
  const live = { ...clone(expected), id: 1, source: 'x', _links: {} };
  live.rules.find((r) => r.type === 'pull_request').parameters.required_reviewers = [];
  live.rules.reverse();
  assert.deepEqual(compareRuleset(expected, live), []);
});

test('a missing rule, a changed parameter, an extra rule and a bypass actor are drift', () => {
  const live = clone(expected);
  live.rules = live.rules.filter((r) => r.type !== 'required_signatures');
  live.rules.find((r) => r.type === 'required_status_checks').parameters.required_status_checks = [{ context: 'Governance Required', integration_id: 15368 }];
  live.rules.find((r) => r.type === 'pull_request').parameters.allowed_merge_methods = ['merge', 'squash'];
  live.rules.push({ type: 'update' });
  live.bypass_actors = [{ actor_id: 5, actor_type: 'RepositoryRole', bypass_mode: 'always' }];
  const d = compareRuleset(expected, live).join('\n');
  assert.match(d, /required_signatures: missing/);
  assert.match(d, /required_status_checks\.required_status_checks/);
  assert.match(d, /pull_request\.allowed_merge_methods/);
  assert.match(d, /rule update: live but not in the payload/);
  assert.match(d, /bypass_actors/);
});

test('a token that cannot see the bypass actors is reported, never taken as "no bypass"', () => {
  const live = clone(expected);
  delete live.bypass_actors;
  const d = compareRuleset(expected, live);
  assert.equal(d.length, 1);
  assert.match(d[0], /bypass_actors: not returned/);
});
