export function detectDelimiter(text: string) {
  const first = (text.split(/\n/)[0] ?? "").trim();
  let comma = 0;
  let semi = 0;
  let tab = 0;
  let quoted = false;
  for (let i = 0; i < first.length; i += 1) {
    const char = first[i];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    if (char === ",") comma += 1;
    if (char === ";") semi += 1;
    if (char === "\t") tab += 1;
  }
  if (tab > comma && tab > semi) return "\t";
  if (semi >= comma) return ";";
  return ",";
}

function parseRecords(text: string, delimiter: string) {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    pushCell();
    if (row.some((item) => item.trim())) records.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      pushCell();
      continue;
    }
    if (char === "\n") {
      pushRow();
      continue;
    }
    if (char === "\r") continue;
    cell += char;
  }
  if (quoted || cell.length || row.length) pushRow();
  return records;
}

export function parseCsv(text: string) {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const delimiter = detectDelimiter(cleaned);
  const records = parseRecords(cleaned, delimiter);
  if (records.length === 0) {
    return { delimiter, headers: [] as string[], rows: [] as string[][] };
  }
  const headers = records[0].map((item) => item.trim());
  const rows = records.slice(1);
  return { delimiter, headers, rows };
}

export function csvEscape(value: string, delimiter = ";") {
  const text = value ?? "";
  if (/["\n\r]/.test(text) || text.includes(delimiter)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: string[][], delimiter = ";") {
  const lines = [headers, ...rows].map((row) => row.map((cell) => csvEscape(cell, delimiter)).join(delimiter));
  return `\uFEFF${lines.join("\n")}\n`;
}
