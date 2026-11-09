// Is an address (or a piece of HTML) Cloudinary's? The host is read from the parsed URL and compared as a whole, never searched as a substring of the text, so
// "https://evil.example/res.cloudinary.com/x" and "https://res.cloudinary.com.evil.example/x" are not Cloudinary's.
// (Task 951, CodeQL js/incomplete-url-substring-sanitization in the LCP probes.)

const CLOUDINARY_HOST = 'res.cloudinary.com';

/** True for an https URL on exactly res.cloudinary.com. */
export function isCloudinaryUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === CLOUDINARY_HOST && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

/** True when the text (an HTML tag, a srcset) holds at least one absolute URL that is a Cloudinary URL. */
export function mentionsCloudinaryUrl(text) {
  for (const match of String(text).matchAll(/https?:\/\/[^\s"'<>),]+/g)) {
    if (isCloudinaryUrl(match[0])) return true;
  }
  return false;
}
