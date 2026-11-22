# Task 1013 — The CI browser jobs install from a cache that only `main` writes

Sprint 93. Priority P1. Owner decisions: O957-6 2026-11-19 (the owner, translated: "Yes", to adding, in Opus's part of `ci.yml`, a browser install that a slow Ubuntu mirror cannot stall). Split out of Task 957 by the owner, 2026-11-22 (translated: "split the task into several subtasks"; option A chosen: each part is its own pull request from `main`, built from the code already written in the working tree of `task/957-signed-listing-uploads`). Corrected 2026-11-22 before execution (checklist D, owner, translated: "fix it"): that code is in commits `da4470783` and `9de067faf`; the cache steps reach `main` in this task's own pull request, reviewed before the merge (option A: "each part is its own pull request"), no longer inside Task 1012's.
Implementer: Opus (`.github/workflows/ci.yml`, `scripts/quality/ci-browser-cache.test.mjs`). Reviewer: Opus. Human owner of the change: the owner.

## Goal

Four CI jobs download the browser and its Ubuntu packages on every run, and a slow mirror made a job time out and `CI Required` fail. After the task the browser and its packages come from a cache keyed by the Playwright version and runner image, saved only by a push to `main`, and the install step has its own time limit.

## Cause

Read at `a9915f3ba`
- A slow mirror stalls the browser jobs (O957-6): four jobs install the browser and its Ubuntu packages afresh on every run (`.github/workflows/ci.yml:61`, `:381`, `:412`, `:457`, the Playwright install with system dependencies). `gh run view 44514575066 --job 135528099769 --log` (main, 2026-11-19) → "Fetched 32.1 MB in 13min 52s (38.5 kB/s)" inside that step; the job hit its 25 minutes during the Story step and was cancelled, so `CI Required` failed. `gh run view 44502368969 --json jobs`, the same for 44508516567 and 44514575066 → the install step of the locale-leak shards took from 21 s to 873 s. Running the jobs in the Playwright container is excluded: `gh api repos/step-security/harden-runner/contents/docs/limitations.md` → "Harden-Runner is not supported when job is run in a container with built-in labels such as `ubuntu-latest`, as it needs sudo access on the Ubuntu VM to run".
Fix: the browser and its `.deb` packages come from an `actions/cache` entry keyed by the Playwright version and the runner image, saved only by a push to `main`; the install step gets its own time limit.

## Scope

- Browser install (O957-6, Opus, `.github/workflows/ci.yml`): in the `quality`, `homepage-grid`, `locale-leak` and `click-shield` jobs the install becomes: a step reading the installed Playwright version (`node -p "require('playwright/package.json').version"`);
  `actions/cache/restore@55cc8345863c7cc4c66a329aec7e433d2d1c52a9` (v6.1.0, `gh api repos/actions/cache/releases/latest` → 2026-06-26) of `~/.cache/ms-playwright` and `~/.cache/playwright-apt`, key `playwright-<ImageOS>-<ImageVersion>-<version>`;
  the restored `.deb` files copied into `/var/cache/apt/archives`; `npx playwright install chromium --with-deps` with `timeout-minutes: 8`; the downloaded `.deb` files copied back; `actions/cache/save` (same SHA) only `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` and on a cache miss.
  apt still checks every cached package against the signed package index, so a changed `.deb` is refused; the browser folder is written only by `main`, which changes only through a reviewed pull request.
  `scripts/quality/ci-browser-cache.test.mjs` (new, Opus; `node --test`, run by the `quality` job's "every scripts/quality/*.test.mjs" step).
- Dependencies: one GitHub action, `actions/cache` v6.1.0, pinned by full SHA (O957-6; GitHub's own action, released 2026-06-26, more than 14 days old).
- Source of the code (option A, owner 2026-11-22): of `.github/workflows/ci.yml` in commit `9de067faf` only the four hunks of O957-6 (`git diff main...9de067faf -- .github/workflows/ci.yml`: `@@ -58`, `@@ -379`, `@@ -410`, `@@ -455`); `scripts/quality/ci-browser-cache.test.mjs` whole (added in `da4470783`, read with `git show 9de067faf:scripts/quality/ci-browser-cache.test.mjs`). Nothing else of those commits.
- Out of scope: the synthetic sweep steps (the hunks `@@ -141`, `@@ -497`, `@@ -506` of the same diff: Task 1012, its own pull request).
- Kept as on `main` (checklist A2): every job keeps its steps and order; only the browser install changes.

## Attack surface

Changed: a cache that jobs holding secrets restore.
- T9 Tampering (cache poisoning, O957-6): a pull request writes a browser or package into the cache that a job holding secrets restores — mitigate: only a push to `main` saves; the key names the Playwright version and runner image; apt verifies each `.deb` against the signed index.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-22).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the cache that jobs holding secrets restore — AC1
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the workflow change reaches `main` only through a reviewed pull request merged by the owner — AC2
- Denial_of_Service: not applicable — the cache changes CI install time only; no request path changes
- File_Upload: not applicable — no file is uploaded; the cache holds a browser and packages
- GitHub_Actions_Security: "If an attacker can inject malicious content into the cache and subsequent workflows (such as release pipelines) restore and use this cache, the poisoned data can be executed in a privileged context" — only a push to `main` saves; apt verifies every cached package against the signed index — AC1
- Injection_Prevention: not applicable — the cache key is built from runner values, never from pull request text
- JavaScript_and_TypeScript_Security: not applicable — the test reads the workflow file; no merge, path setter or eval
- Key_Management: not applicable — no key or secret is added to the new steps
- OS_Command_Injection_Defense: not applicable — the shell steps take no value from a pull request or issue
- Secrets_Management: not applicable — no secret is added or passed to the new cache steps
- Secure_Code_Review: "Security-Focused Review differs from functional code review by specifically targeting security concerns" — Opus reviews the cache steps on `main` by `secure-code-review.md` — AC2
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — the one dependency added is `actions/cache`, GitHub's own action, pinned by the full SHA of its v6.1.0 release; the implementing Opus session's every claim is rerun by the reviewing session — AC1, AC2
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — threat T9 became an acceptance criterion — AC1
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — `actions/cache` is pinned to the full commit SHA of its v6.1.0 release — AC1
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them for T9 — AC1
- User_Privacy_Protection: not applicable — the cache holds a browser and packages, no personal data
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every claim of the executor's report — AC2
## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The browser jobs install from a cache that only `main` writes (O957-6) — test: `scripts/quality/ci-browser-cache.test.mjs` (new, Opus): every job of `.github/workflows/ci.yml` that runs `playwright install` restores `actions/cache/restore` at the pinned SHA before it, the install step has `timeout-minutes`, and every `actions/cache/save` runs only under `github.event_name == 'push' && github.ref == 'refs/heads/main'`; after the merge, the first `main` run saves the entry and the next run's install step takes under 90 s with "Need to get 0 B" of packages in its log (Opus reads `gh run view <id> --log`).
- AC2 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. The owner creates the branch `task/1013-ci-browser-cache-main-only` from `main` with this kickoff committed on it (checklist H). It does not wait for Task 1012: the two pull requests change different hunks of `ci.yml`.
2. Test first: `scripts/quality/ci-browser-cache.test.mjs` from `9de067faf`; run `node --test scripts/quality/ci-browser-cache.test.mjs`; it fails on `main`'s `ci.yml`; keep that output.
3. The change: the four `ci.yml` hunks of the Scope from `9de067faf`.
4. Run: `node --test scripts/quality/ci-browser-cache.test.mjs`; nothing else runs locally. Break, once, then restore: the `main`-only condition of one `actions/cache/save` step (the test fails). CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>` (checklist A5); after the merge Opus reads two `main` runs with `gh run list --branch main --limit 3` (the cache saved, then restored).
5. Report: each command, exit code, relevant output; the failing run before the change; the break output.

## Review
