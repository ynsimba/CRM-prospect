import { slugify } from "@/lib/crm";

export const IMPORT_FIELDS = [
  { key: "firstName", label: "Prénom" },
  { key: "lastName", label: "Nom" },
  { key: "company", label: "Entreprise" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Téléphone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "city", label: "Ville" },
  { key: "industry", label: "Secteur" },
  { key: "source", label: "Source" },
  { key: "owner", label: "Responsable" },
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number]["key"];
export type ColumnMapping = Partial<Record<ImportField, string>>;

export type MappedImportRow = Record<ImportField, string> & { line: number };

export type ImportIssue = "missing-name" | "invalid-email" | "duplicate-file" | "duplicate-db";

export type ClassifiedImportRow = MappedImportRow & {
  issue: ImportIssue | null;
  duplicateOf?: string;
};

export type ExistingProspectIndex = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  companyName?: string | null;
};

const ALIASES: Record<ImportField, string[]> = {
  firstName: ["prenom", "firstname", "first_name", "firstname", "givenname"],
  lastName: ["nom", "lastname", "last_name", "nomdefamille", "surname", "familyname"],
  company: ["entreprise", "societe", "company", "organisation", "organization", "compte"],
  email: ["email", "e-mail", "mail", "courriel"],
  phone: ["telephone", "tel", "phone", "mobile", "portable"],
  whatsapp: ["whatsapp", "wa", "whatsapp"],
  city: ["ville", "city", "localite"],
  industry: ["secteur", "industry", "secteurdactivite", "activite"],
  source: ["source", "origine", "canal"],
  owner: ["responsable", "commercial", "owner", "assigne", "assigned"],
};

export function normalizeHeader(value: string) {
  return slugify(value).replace(/-/g, "");
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const used = new Set<string>();
  const mapping: ColumnMapping = {};
  for (const field of IMPORT_FIELDS) {
    const aliases = ALIASES[field.key];
    const match = headers.find((header) => {
      if (used.has(header)) return false;
      const key = normalizeHeader(header);
      return aliases.includes(key) || key === field.key.toLowerCase();
    });
    if (match) {
      mapping[field.key] = match;
      used.add(match);
    }
  }
  return mapping;
}

export function applyMapping(headers: string[], rows: string[][], mapping: ColumnMapping): MappedImportRow[] {
  const indexByHeader = new Map(headers.map((header, index) => [header, index]));
  return rows.map((row, offset) => {
    const values = {} as Record<ImportField, string>;
    for (const field of IMPORT_FIELDS) {
      const header = mapping[field.key];
      const index = header !== undefined ? indexByHeader.get(header) : undefined;
      values[field.key] = index === undefined ? "" : (row[index] ?? "").trim();
    }
    return { ...values, line: offset + 2 };
  });
}

export function digits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function normalizeEmail(value: string | null | undefined) {
  const text = (value ?? "").trim().toLowerCase();
  return text || null;
}

function nameCompanyKey(firstName: string, lastName: string, companyName?: string | null) {
  const people = slugify(`${firstName} ${lastName}`);
  const company = slugify(companyName ?? "");
  if (!people) return "";
  return company ? `${people}|${company}` : "";
}

function contactKeys(row: {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
}) {
  const keys: string[] = [];
  const email = normalizeEmail(row.email);
  if (email) keys.push(`email:${email}`);
  const phone = digits(row.phone);
  if (phone.length >= 7) keys.push(`phone:${phone}`);
  const whatsapp = digits(row.whatsapp);
  if (whatsapp.length >= 7) keys.push(`wa:${whatsapp}`);
  const nameKey = nameCompanyKey(row.firstName ?? "", row.lastName ?? "", row.companyName);
  if (nameKey) keys.push(`name:${nameKey}`);
  return keys;
}

export function classifyImportRows(
  rows: MappedImportRow[],
  existing: ExistingProspectIndex[],
): ClassifiedImportRow[] {
  const seen = new Set<string>();
  const db = new Set<string>();
  for (const item of existing) {
    for (const key of contactKeys({
      email: item.email,
      phone: item.phone,
      whatsapp: item.whatsapp,
      firstName: item.firstName,
      lastName: item.lastName,
      companyName: item.companyName,
    })) {
      db.add(key);
    }
  }

  return rows.map((row) => {
    if (!row.firstName || !row.lastName) {
      return { ...row, issue: "missing-name" as const };
    }
    if (row.email && !row.email.includes("@")) {
      return { ...row, issue: "invalid-email" as const };
    }

    const keys = contactKeys({
      email: row.email,
      phone: row.phone,
      whatsapp: row.whatsapp,
      firstName: row.firstName,
      lastName: row.lastName,
      companyName: row.company,
    });

    const fileHit = keys.find((key) => seen.has(key));
    for (const key of keys) seen.add(key);
    if (fileHit) {
      return { ...row, issue: "duplicate-file" as const, duplicateOf: fileHit };
    }

    const dbHit = keys.find((key) => db.has(key));
    if (dbHit) {
      return { ...row, issue: "duplicate-db" as const, duplicateOf: dbHit };
    }

    return { ...row, issue: null };
  });
}

export function importStats(rows: ClassifiedImportRow[]) {
  return {
    total: rows.length,
    ready: rows.filter((row) => row.issue === null).length,
    duplicateFile: rows.filter((row) => row.issue === "duplicate-file").length,
    duplicateDb: rows.filter((row) => row.issue === "duplicate-db").length,
    errors: rows.filter((row) => row.issue === "missing-name" || row.issue === "invalid-email").length,
  };
}

export const TEMPLATE_HEADERS = IMPORT_FIELDS.map((field) => field.label);

export const TEMPLATE_SAMPLE: string[] = [
  "Dieudonné",
  "Kalala",
  "Kalala Mines",
  "dkalala@example.cd",
  "+243 810 400 001",
  "+243 810 400 001",
  "Lubumbashi",
  "Mines",
  "Import CSV",
  "Jean Dupont",
];
