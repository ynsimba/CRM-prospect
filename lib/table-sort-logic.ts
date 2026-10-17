export type SortDirection = "ascending" | "descending";

export type SortKey =
  | { kind: "empty" }
  | { kind: "date"; value: number }
  | { kind: "number"; value: number }
  | { kind: "text"; value: string };

const DATE_FR = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s*(?:à\s*)?(\d{1,2})[:h](\d{2}))?/;
const NUMBER = /^[-+]?\d+(?:[.,]\d+)?$/;
const EMPTY = new Set(["", "—", "-", "–", "n/a"]);

/** Clé de tri d'une cellule : date « jj/mm/aaaa », nombre (espaces, %, devise retirés) ou texte. */
export function sortKey(raw: string): SortKey {
  const text = raw.replace(/\s+/g, " ").trim();
  if (EMPTY.has(text.toLowerCase())) return { kind: "empty" };

  const date = DATE_FR.exec(text);
  if (date) {
    const year = date[3].length === 2 ? 2000 + Number(date[3]) : Number(date[3]);
    const value = new Date(year, Number(date[2]) - 1, Number(date[1]), Number(date[4] ?? 0), Number(date[5] ?? 0)).getTime();
    if (!Number.isNaN(value)) return { kind: "date", value };
  }

  const compact = text.replace(/[\s  ]/g, "").replace(/(%|\$|€|usd|cdf|fc|pts?)$/i, "");
  if (NUMBER.test(compact)) return { kind: "number", value: Number(compact.replace(",", ".")) };

  return { kind: "text", value: text };
}

const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });

/** Compare deux clés ; les cellules vides restent toujours en fin de liste. */
export function compareKeys(a: SortKey, b: SortKey, direction: SortDirection) {
  if (a.kind === "empty" || b.kind === "empty") {
    if (a.kind === b.kind) return 0;
    return a.kind === "empty" ? 1 : -1;
  }
  const sign = direction === "ascending" ? 1 : -1;
  if (a.kind !== "text" && a.kind === b.kind) return sign * (a.value - (b as { value: number }).value);
  return sign * collator.compare(String(a.value), String(b.value));
}

export function nextDirection(current: string | null): SortDirection {
  return current === "ascending" ? "descending" : "ascending";
}
