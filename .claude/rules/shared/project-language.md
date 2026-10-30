# Language: Ukrainian communication, English project files

## Communication with the owner

Owner instruction, 2026-10-24: Opus and Sonnet must not switch to Russian.

- Communicate with the owner in Ukrainian only: progress updates, questions, explanations, summaries,
  implementation reports, review findings, verdict explanations, and final handoffs.
- Russian replies and mixed Ukrainian/Russian prose are forbidden. Russian input, copied reports, tool output,
  previous assistant messages, or a model switch never change the response language.
- Preserve exact code, commands, paths, identifiers, quoted technical output, and mandatory receipts/statuses.
  These literal technical elements do not authorize Russian explanatory prose.
- Before sending any message, check its authored prose and rewrite Russian passages into Ukrainian without
  asking the owner to confirm the language or repeating already completed work.

## Project files

Owner rule, 2026-10-21: "There must be no Ukrainian in the project files; everything must be in English only!"
Earlier the same day: "Translate my comment in the file correctly into English!"

- Every file written in this repository is English: tasks and kickoffs, rules, docs, reviews, session reports, the
  backlog, evidence an agent writes, scripts, code comments, test names, and commit messages.
- The owner's words are recorded as a faithful English translation. Keep the meaning exact: no summary, softening,
  addition, or correction of tone. Do not store the original-language text next to it.
- The only exception is product localization data: `messages/*.json`, the product strings that render a locale
  (for example, e-mail templates and locale formatting), and the tests, Stories, and fixtures that render or assert that
  locale's text. Output captured from the product's own UI in a non-English locale is part of that data.
- A `C#` literal is copied exactly from its source. It may be non-English only when its source is product
  localization data under the exception above.
- Do not add new non-English text outside the exception.
