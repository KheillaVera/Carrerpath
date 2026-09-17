/**
 * Link safety.
 *
 * Any URL shown in the interface came from a person — a candidate's project
 * link, an employer's website, a meeting link. Putting one straight into an
 * href allows `javascript:` and `data:` URLs, which execute in the browser of
 * whoever clicks them. The server rejects those on write; this is the second
 * line, for rows written before that rule existed.
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export function safeUrl(value, { allowMailto = false } = {}) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    // A bare domain such as "example.rw" is treated as https rather than discarded.
    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(candidate);
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
    if (url.protocol === 'mailto:' && !allowMailto) return null;
    return url.toString();
  } catch (_err) {
    return null;
  }
}

/** The host on its own, for showing a link without its query string. */
export function displayHost(value) {
  const safe = safeUrl(value);
  if (!safe) return null;
  try {
    return new URL(safe).host.replace(/^www\./, '');
  } catch (_err) {
    return null;
  }
}

/** Props every external link should carry, so a new tab cannot reach back. */
export const EXTERNAL_LINK_PROPS = { target: '_blank', rel: 'noopener noreferrer' };
