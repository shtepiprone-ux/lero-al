/**
 * Text that comes from a person, made safe to put inside an HTML e-mail body or attribute (Task 923 Revision 7, finding S22).
 * `& < > " '` become entities, so `<a href="https://evil.example">verify your account</a>` is shown as text, not rendered as a link in a message that
 * comes from our own domain. A line break may be turned into `<br />` after escaping.
 */
const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c])
}

export function escapeHtmlWithBreaks(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br />')
}
