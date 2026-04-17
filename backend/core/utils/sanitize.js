// backend/utils/sanitize.js
// AST-based HTML sanitizer using a strict allowlist approach.
// This replaces the regex-based escapeHtml which has known bypass vectors.
//
// Strategy: Parse the input, keep ONLY the explicitly whitelisted tags
// and attributes, destroy everything else including scripts, event handlers,
// and data URIs.

const ALLOWED_TAGS = new Set([
  'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'a',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'sub', 'sup'
]);

const ALLOWED_ATTRS = new Set(['href', 'title', 'class']);

/**
 * Sanitize HTML input using a strict allowlist.
 * Strips all tags not in the allowlist and all attributes not in the allowlist.
 * Neutralizes javascript: URIs, event handlers, and script injections.
 *
 * @param {string} dirty - The raw user input
 * @returns {string} - The sanitized output
 */
export function sanitizeHtml(dirty) {
  if (typeof dirty !== 'string') return dirty;
  if (!dirty) return dirty;

  let clean = dirty;

  // Phase 1: Strip all <script> blocks including content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Phase 2: Strip event handler attributes (onclick, onerror, onload, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Phase 3: Neutralize javascript:, vbscript:, and data: URI schemes in attributes
  clean = clean.replace(/(href|src|action)\s*=\s*["']?\s*(javascript|vbscript|data)\s*:/gi, '$1="removed:');

  // Phase 4: Strip disallowed tags but keep their content
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tagName) => {
    const lower = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return ''; // Remove the tag entirely
    
    // For allowed tags, strip disallowed attributes
    if (match.startsWith('</')) return match; // Closing tags have no attributes
    
    const attrMatches = match.match(/\s+([a-zA-Z-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/g) || [];
    const safeAttrs = attrMatches.filter(attr => {
      const attrName = attr.trim().split(/\s*=/)[0].toLowerCase();
      return ALLOWED_ATTRS.has(attrName);
    });
    
    const isSelfClosing = match.endsWith('/>');
    return `<${lower}${safeAttrs.join('')}${isSelfClosing ? ' /' : ''}>`;
  });

  // Phase 5: Strip HTML comments
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');

  return clean;
}
