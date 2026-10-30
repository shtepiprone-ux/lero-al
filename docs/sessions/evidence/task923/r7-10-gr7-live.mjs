// Task 923 Revision 6 - GR-7 live check (moment: execution), run BEFORE the first Revision 6 write.
//   node docs/sessions/evidence/task923/r7-10-gr7-live.mjs > docs/sessions/evidence/task923/r7-10-gr7-live.json
// Subject: (R28) a modal dialog's dismissal is judged on whether it closes; (R31) a page that loads content late is
// measured once it has settled. Primary sources: WAI-ARIA APG Dialog (Modal) pattern; WCAG 2.2 SC 1.4.10 Reflow
// (the criterion the gate measures: the page content that exists, not a half-loaded page). TailAdmin is not
// re-operated: no visible reference applies to timing of a measurement. Lahomes / Kamr / Omah are not relied on.
const out = [];

async function literal(url, patterns) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return {
      source: url,
      status: res.status,
      literals: patterns.map((p) => {
        const i = text.search(p);
        return { pattern: String(p), literal: i >= 0 ? text.slice(Math.max(0, i - 100), i + 220) : 'NOT FOUND' };
      }),
    };
  } catch (e) {
    return { source: url, error: String(e.message).split('\n')[0] };
  }
}

out.push(await literal('https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/', [/Escape/i, /Tab and Shift \+ Tab do not move focus outside the dialog/i, /returns focus to the element that invoked the dialog/i]));
out.push(await literal('https://www.w3.org/WAI/WCAG21/Understanding/reflow', [/without loss of information or functionality/i]));
console.log(JSON.stringify(out, null, 1));
