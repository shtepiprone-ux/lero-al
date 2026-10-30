# Cloudflare Turnstile documentation, short quotes (Task 923 Revision 33 design, Opus, 2026-10-22)

Read on 2026-10-22 through the web-fetch agent; every page answered HTTP 200. One quote per line, under 25 words, with its page.

1. Widget sizes table, https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/ : row "Flexible", width "100% (min: 300px)", height "65px"
2. Widget sizes table, same page: row "Compact", width "150px", height "140px", use "Space-constrained layouts"
3. Appearance, same page: "The widget becomes visible only when visitor interaction is required"
4. Callback reference, same page: "A JavaScript callback invoked before the challenge enters interactive mode."
5. Callback reference, same page: "A JavaScript callback invoked when challenge has left interactive mode."
6. Action, same page: "This can only contain up to 32 alphanumeric characters including `_` and `-`."
7. Server-side validation, https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ : "Tokens are single-use. Each token can only be validated once."
8. Server-side validation, same page: "Each token is valid for 300 seconds (5 minutes) after generation."
9. Server-side validation, same page: "A replayed token will be rejected with the `timeout-or-duplicate` error code."
10. Server-side validation, same page: "Check additional fields. Validate the action and hostname when specified."
11. Server-side validation, same page, response field `hostname`: "Hostname where the challenge was served"
12. Server-side validation, same page, response field `action`: "Custom action identifier from client-side"
13. Testing, https://developers.cloudflare.com/turnstile/troubleshooting/testing/ : site key `3x00000000000000000000FF` "Forces interactive challenge (Visible)"
14. Testing, same page: "Test sitekeys generate a dummy token: `XXXX.DUMMY.TOKEN.XXXX`"
