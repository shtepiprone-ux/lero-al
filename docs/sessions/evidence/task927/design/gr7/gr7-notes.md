# Task 927 — GR-7 reference research (Opus, task design, 2026-10-20)

Subject: where a sign-in form places its Google (social) sign-in and how it looks on a phone.
Library: `docs/research/references/2026-10-04/` (summary.md, shots-*). Live-checked 2026-10-20 at 390 px with Playwright and
by `curl` of the page HTML (saved beside this file).

| Reference | Page | Live check | Observation |
|---|---|---|---|
| TailAdmin | https://demo.tailadmin.com/signin | HTTP 200, `tailadmin-signin.html`; 390 px capture stalled on the page preloader (UNVERIFIED at 390, not relied on) | Sign in with Google button above the e-mail form, separated by an Or divider (library `shots-tailadmin/084-1440.jpg`) |
| Lahomes | https://techzaa.in/lahomes/admin/auth-signin.html | HTTP 200, `lahomes-auth-signin.html`, `lahomes-signin-390.png` | Google icon button below the Sign In button after an OR sign with divider; at 390 px the form is one column |
| Omah | https://omah.dexignzone.com/xhtml/pages/login.html | HTTP 200, `omah-pages-login.html`, `omah-login-390.png` | No social sign-in: username, password, Sign In, Sign up link |
| Kamr | https://kamr-vite.vercel.app/login | HTTP 200 (SPA), `kamr-login-390.png` | No social sign-in: e-mail, password, Sign Me In, Sign up link |

Options across references: a Google button above the form (TailAdmin), an icon button under the primary button after a divider
(Lahomes), no social sign-in (Omah, Kamr).
Chosen for lero.al: keep today's order (primary e-mail Sign in, then the `or` divider, then the Google button full width, then the
register link), which matches Lahomes' order; the button itself is Google's rendered button (owner decision D2), which is also what
Google's own documentation prescribes for the ID-token flow.
