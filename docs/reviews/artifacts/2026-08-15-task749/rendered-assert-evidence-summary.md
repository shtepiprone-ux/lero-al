# Task 749 rendered-assert evidence summary

This is the retained, CI-addressable summary of the Task 749 rendered-assert
evidence. The source manifests were generated under the ignored `.screenshots/`
directory and are deliberately not listed as ledger paths: a fresh CI checkout
does not contain them. Their SHA-256 digests and measured summaries are retained
here so the review record does not pretend those local directories are versioned.

| Run | SHA-256 of `manifest.json` | Result summary |
| --- | --- | --- |
| 14-47 | `d82a7b9bcf4d49009a35cc2c3fd8e3c6eabe340d11179d9850db188ad4b69bd4` | 1204 total; 1179 pass; 3 fail; 22 ambiguous; 3 text-clipped; 24 ambiguous-overlap |
| 15-36 | `48506e254d5e65423d13bc7d883339effc4dc8dbd32770d4769631a508ce49f0` | 1204 total; 1177 pass; 0 fail; 27 ambiguous; 0 text-clipped; 27 ambiguous-overlap |
| 16-08 | `b769253ee1fe0c785413a26267ae66c402cc64abd0a80e674dddfd06c0ca69b6` | 1204 total; 1177 pass; 3 fail; 24 ambiguous; 3 text-clipped; 2 offscreen-control; 24 ambiguous-overlap |
| 16-39 | `e5dc9514b264458a529bd219026015bd2c26059823dba5fa4dee2b3019eb694e` | 1204 total; 1177 pass; 6 fail; 21 ambiguous; 6 outside-container; 27 ambiguous-overlap |
| 17-11 | `04d30cfe4aff27b5d4fd8b9c78d2363017cbacffcda4c0431fa849fe6b11d0eb` | 1204 total; 1177 pass; 7 fail; 20 ambiguous; 7 text-clipped; 24 ambiguous-overlap |
| 17-43 | `44c40f376a827d482fc9c7fdcc81d25f701ef116793874727c07b105836a87d7` | 1204 total; 1164 pass; 17 fail; 23 ambiguous; 16 text-clipped; 1 blank-canvas; 1 blank-screenshot; 27 ambiguous-overlap |
| 18-14 | `fe30281661cc69f4941311ea1c3bd76d36aea62eea81697b394770e1326c47a0` | 1204 total; 1177 pass; 0 fail; 27 ambiguous; 0 text-clipped; 27 ambiguous-overlap |

The original review also compared every verdict between runs 14-47 and 18-14:
exactly five of 1204 cells changed, while the remaining 1199 were unchanged.
The final clean run, 18-14, has the same `1177 / 0 / 27` pass/fail/ambiguous
triple as 15-36. The current PR's independent rendered-proof CI job is the
authoritative fresh rendering check; this document preserves the historical
review evidence without making CI depend on an ignored workspace directory.
