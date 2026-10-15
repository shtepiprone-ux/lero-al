# Task 923 review 5 — Revision 4 (Opus, 2026-10-15)

Verdict: **NEEDS REVISION** → kickoff §14 (Revision 5: R24–R27, AC23–AC28). Native Windows, Node v22.22.3.

## Verified (FACT)

| Item | Evidence |
|---|---|
| Delivered files equal the executor's end hashes, 56 of 56 | `sha1sum -c` over `r5-87-hashes-end.txt` (this session) |
| R22 in the code as written | `scripts/rendered-state-census/in-page.mjs:122-138, 225-232` |
| AC20: self-test 46 cases, exit 0 | `rv5-01-verify.txt` |
| AC20: mutation proof 15 of 15 | `rv5-02-mutations.txt` |
| AC21: 22 740 unique rows, 20 rule keys, gate cells only 924 at 640 and the 925 cell | `rv5-52-ac21-checks.txt` |
| AC21: classes reproduce (0 image-layer, Leaflet equal, chart 31 + 39, gallery 228 + 12, 0 other) | `rv5-50-d16-classes.txt`, `rv5-51-gallery-classes.txt` |
| R23 owner table | executor `r5-84-*`, accepted |

## Findings

1. P1 — action rules fail a correct carousel (hidden, untabbable, clipped-away slides): `rv5-01-verify.txt:49`, `rv5-11-probe.txt`. → R24.
2. P1 — in-flow visible slide judged against its displaced track: `rv5-11-probe.txt`. → R25.
3. P1 — verdict not deterministic: `r5-85-row-diff.txt`, `rv5-30-flip-details.txt`, `rv5-41-trap-compare.txt`,
   `rv5-44-misc-compare.txt`; causes in `rv5-42-trap-probe.txt` (focus read before it settles), `rv5-46-toast-probe.txt`
   and `rv5-47-anim-probe.txt` (infinite animations hold `waitStable` to its 4 s bound), `rv5-45-focusopen-probe.txt`
   (AdminShell drawer: a product race, the gate is right). → R26.
4. P2 — `check:mojibake` ENOBUFS on a >1 MiB listing: `rv5-60-mojibake.txt`, executor `r5-95-probe-enobuf.txt`. → R27.
5. P3 — whole suite red twice here too (`rv5-20-vitest-all-1/2.txt`), the failing files green alone
   (`rv5-21-vitest-failed-isolated.txt`). → AC28 replaces AC22; a task is filed at closure.

## Gates run by Opus

`rv5-90-check-kickoff-evidence.txt` (PASS), `rv5-91-mobile-contract.txt` (PASS), `rv5-92-backlog-active.txt` (PASS),
`rv5-93-mojibake-diagnostic.txt` (diagnostic only, buffer raised: 0 artifacts). GR-7: `rv5-03-gr7.md`.

`fixtures/` and `rv5-1x` probes are diagnosis only; they run the delivered, unmodified measuring code.
