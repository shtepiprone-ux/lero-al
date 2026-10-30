/**
 * Does a module start with the directive `'use server'` / `'use client'`? Comments and blank lines may come before it (a long header comment is common),
 * so the first 600 characters are NOT the right window: `applyListingTransition.ts` opens its directive after ~3 000 characters of documentation, and a scanner that only
 * looked at the top of the file did not see that it is a Server Action file (Task 923 Revision 7, finding S28).
 */
export function hasDirective(text: string, directive: 'use server' | 'use client'): boolean {
  const lead = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/.exec(text)?.[0] ?? ''
  const rest = text.slice(lead.length)
  // a module may carry several directives in a row; any of them counts
  const directives = /^(?:(['"])([^'"\n]+)\1;?\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*)+/.exec(rest)?.[0] ?? ''
  return new RegExp(`(['"])${directive}\\1`).test(directives)
}
