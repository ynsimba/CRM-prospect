const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "div",
]);

const MAX_NOTE_HTML = 50_000;

function extractHref(attrs: string) {
  const match = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const href = (match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
  if (!href || /^(javascript:|data:)/i.test(href)) return "";
  if (/^(https?:|mailto:|\/|#)/i.test(href)) {
    return href.replace(/"/g, "&quot;");
  }
  return "";
}

export function sanitizeNoteHtml(input: string) {
  const raw = String(input ?? "").replace(/\0/g, "").slice(0, MAX_NOTE_HTML);
  const stripped = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  const html = stripped.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, tag: string, attrs = "") => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (name === "br") return "<br>";
    if (match.startsWith("</")) return `</${name}>`;
    if (name === "a") {
      const href = extractHref(String(attrs));
      return href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">` : "<a>";
    }
    return `<${name}>`;
  });

  return html.trim();
}

export function noteExcerpt(html: string, max = 140) {
  const text = sanitizeNoteHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Note vide";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function noteTitleFrom(value: FormDataEntryValue | null, fallback = "Sans titre") {
  const title = String(value ?? "").trim();
  return title || fallback;
}
