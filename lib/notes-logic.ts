const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "div",
  "span",
  "font",
]);

const BLOCK_TAGS = new Set(["p", "div", "h2", "h3", "li", "blockquote"]);

const MAX_NOTE_HTML = 50_000;

const SAFE_ALIGN = new Set(["left", "center", "right", "justify"]);

function extractHref(attrs: string) {
  const match = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const href = (match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
  if (!href || /^(javascript:|data:)/i.test(href)) return "";
  if (/^(https?:|mailto:|\/|#)/i.test(href)) {
    return href.replace(/"/g, "&quot;");
  }
  return "";
}

function extractAttr(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return (match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
}

function isSafeColor(value: string) {
  const v = value.trim().toLowerCase();
  if (!v || /url\s*\(|expression\s*\(|javascript:|var\s*\(/i.test(v)) return false;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return true;
  if (/^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+\s*)?\)$/i.test(v)) return true;
  if (/^[a-z]{3,20}$/i.test(v)) return true;
  return false;
}

function isSafeFontFamily(value: string) {
  return /^[a-z0-9\s,\-"']{1,120}$/i.test(value.trim()) && !/url\s*\(|expression|javascript/i.test(value);
}

function isSafeFontSize(value: string) {
  return /^[\d.]+\s*(px|pt|em|rem|%)$/i.test(value.trim());
}

function sanitizeStyle(style: string) {
  const parts: string[] = [];
  for (const decl of style.split(";")) {
    const colon = decl.indexOf(":");
    if (colon < 0) continue;
    const prop = decl.slice(0, colon).trim().toLowerCase();
    const value = decl.slice(colon + 1).trim();
    if (!value) continue;
    if (prop === "color" || prop === "background-color") {
      if (isSafeColor(value)) parts.push(`${prop}: ${value}`);
      continue;
    }
    if (prop === "font-family" && isSafeFontFamily(value)) {
      parts.push(`${prop}: ${value}`);
      continue;
    }
    if (prop === "font-size" && isSafeFontSize(value)) {
      parts.push(`${prop}: ${value}`);
      continue;
    }
    if (prop === "text-align" && SAFE_ALIGN.has(value.toLowerCase())) {
      parts.push(`${prop}: ${value.toLowerCase()}`);
    }
  }
  return parts.join("; ");
}

function openTag(name: string, attrs: string) {
  if (name === "br") return "<br>";
  if (name === "a") {
    const href = extractHref(attrs);
    return href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">` : "<a>";
  }

  const style = sanitizeStyle(extractAttr(attrs, "style"));
  const kept: string[] = [];
  if (style) kept.push(`style="${style.replace(/"/g, "&quot;")}"`);

  if (BLOCK_TAGS.has(name)) {
    const align = extractAttr(attrs, "align").toLowerCase();
    if (SAFE_ALIGN.has(align) && !style.includes("text-align")) {
      kept.push(`style="text-align: ${align}"`);
    }
  }

  if (name === "font") {
    const face = extractAttr(attrs, "face");
    const color = extractAttr(attrs, "color");
    const size = extractAttr(attrs, "size");
    const fontStyles: string[] = [];
    if (face && isSafeFontFamily(face)) fontStyles.push(`font-family: ${face}`);
    if (color && isSafeColor(color)) fontStyles.push(`color: ${color}`);
    if (/^[1-7]$/.test(size)) {
      const px = { "1": "10px", "2": "13px", "3": "16px", "4": "18px", "5": "24px", "6": "32px", "7": "48px" }[size];
      if (px) fontStyles.push(`font-size: ${px}`);
    }
    const merged = [style, ...fontStyles].filter(Boolean).join("; ");
    return merged ? `<span style="${merged.replace(/"/g, "&quot;")}">` : "<span>";
  }

  return kept.length ? `<${name} ${kept.join(" ")}>` : `<${name}>`;
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
    if (match.startsWith("</")) {
      if (name === "font") return "</span>";
      return `</${name}>`;
    }
    return openTag(name, String(attrs));
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

export const NOTE_FONTS = [
  { value: "Outfit, sans-serif", label: "Outfit" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: '"Times New Roman", Times, serif', label: "Times" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: '"Courier New", Courier, monospace', label: "Courier" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
] as const;

export const NOTE_FONT_SIZES = [
  { value: "12px", label: "12 px" },
  { value: "14px", label: "14 px" },
  { value: "16px", label: "16 px" },
  { value: "18px", label: "18 px" },
  { value: "20px", label: "20 px" },
  { value: "24px", label: "24 px" },
  { value: "28px", label: "28 px" },
  { value: "32px", label: "32 px" },
  { value: "40px", label: "40 px" },
  { value: "48px", label: "48 px" },
  { value: "56px", label: "56 px" },
  { value: "64px", label: "64 px" },
  { value: "72px", label: "72 px" },
  { value: "80px", label: "80 px" },
  { value: "90px", label: "90 px" },
  { value: "100px", label: "100 px" },
] as const;
