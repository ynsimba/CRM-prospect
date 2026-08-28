import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { computeProspectScore, slugify } from "@/lib/crm";
import { parseCsv, toCsv } from "@/lib/csv";
import {
  IMPORT_FIELDS,
  TEMPLATE_HEADERS,
  TEMPLATE_SAMPLE,
  applyMapping,
  autoMapColumns,
  classifyImportRows,
  importStats,
  type ColumnMapping,
  type ClassifiedImportRow,
} from "@/lib/import-logic";
import type { SessionPayload } from "@/lib/session";

export const MAX_IMPORT_ROWS = 500;
export const MAX_IMPORT_BYTES = 1_500_000;

export type ImportPreview = {
  headers: string[];
  mapping: ColumnMapping;
  rows: ClassifiedImportRow[];
  stats: ReturnType<typeof importStats>;
};

function mappingOrAuto(headers: string[], mapping?: ColumnMapping): ColumnMapping {
  const filled = mapping && Object.values(mapping).some(Boolean);
  return filled ? mapping! : autoMapColumns(headers);
}

export function parseImportFile(text: string, mapping?: ColumnMapping) {
  const parsed = parseCsv(text);
  if (parsed.headers.length === 0) {
    throw new Error("Le fichier CSV est vide.");
  }
  if (parsed.rows.length === 0) {
    throw new Error("Aucune ligne de données dans le fichier.");
  }
  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Maximum ${MAX_IMPORT_ROWS} lignes par import.`);
  }
  const resolved = mappingOrAuto(parsed.headers, mapping);
  const mapped = applyMapping(parsed.headers, parsed.rows, resolved);
  return { headers: parsed.headers, mapping: resolved, mapped };
}

export async function previewProspectImport(
  session: SessionPayload,
  text: string,
  mapping?: ColumnMapping,
): Promise<ImportPreview> {
  const { headers, mapping: resolved, mapped } = parseImportFile(text, mapping);
  const existing = await prisma.prospect.findMany({
    where: orgScope(session),
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      whatsapp: true,
      company: { select: { name: true } },
    },
    take: 4000,
  });
  const rows = classifyImportRows(
    mapped,
    existing.map((item) => ({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      phone: item.phone,
      whatsapp: item.whatsapp,
      companyName: item.company?.name ?? null,
    })),
  );
  return { headers, mapping: resolved, rows, stats: importStats(rows) };
}

function matchBySlug<T extends { name: string; slug?: string }>(items: T[], value: string) {
  const key = slugify(value);
  if (!key) return undefined;
  return items.find((item) => slugify(item.name) === key || (item.slug && item.slug === key));
}

export async function commitProspectImport(
  session: SessionPayload,
  text: string,
  mapping: ColumnMapping | undefined,
  options: { skipDuplicates: boolean },
) {
  const preview = await previewProspectImport(session, text, mapping);
  const accepted = preview.rows.filter((row) => {
    if (row.issue === "missing-name" || row.issue === "invalid-email") return false;
    if (options.skipDuplicates && (row.issue === "duplicate-file" || row.issue === "duplicate-db")) {
      return false;
    }
    return true;
  });

  const [statuses, sources, owners, companies] = await Promise.all([
    prisma.prospectStatus.findMany({ where: orgScope(session) }),
    prisma.prospectSource.findMany({ where: orgScope(session) }),
    prisma.user.findMany({
      where: { ...orgScope(session), isActive: true, role: { not: "SUPER_ADMIN" } },
      select: { id: true, name: true, email: true },
    }),
    prisma.company.findMany({
      where: orgScope(session),
      select: { id: true, name: true },
    }),
  ]);

  const nouveau = statuses.find((item) => item.slug === "nouveau") ?? statuses[0];
  if (!nouveau) {
    throw new Error("Aucun statut configuré.");
  }
  const importSource = sources.find((item) => item.slug === "import") ?? sources[0];

  const companyIds = new Map(companies.map((item) => [slugify(item.name), item.id]));
  let createdCompanies = 0;
  let created = 0;
  const failures: string[] = [];

  for (const row of accepted) {
    try {
      let companyId: string | undefined;
      if (row.company) {
        const key = slugify(row.company);
        const cached = companyIds.get(key);
        if (cached) {
          companyId = cached;
        } else {
          const company = await prisma.company.create({
            data: {
              organizationId: session.organizationId,
              ownerId: session.userId,
              name: row.company,
              industry: row.industry || undefined,
              city: row.city || undefined,
              country: "RD Congo",
            },
          });
          companyIds.set(key, company.id);
          companyId = company.id;
          createdCompanies += 1;
        }
      }

      const source =
        (row.source ? matchBySlug(sources, row.source) : undefined) ?? importSource;
      const owner =
        (row.owner
          ? owners.find(
              (item) =>
                slugify(item.name) === slugify(row.owner) ||
                item.email.toLowerCase() === row.owner.trim().toLowerCase(),
            )
          : undefined) ?? undefined;

      await prisma.prospect.create({
        data: {
          organizationId: session.organizationId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || undefined,
          phone: row.phone || undefined,
          whatsapp: row.whatsapp || undefined,
          city: row.city || undefined,
          country: "RD Congo",
          companyId,
          statusId: nouveau.id,
          sourceId: source?.id,
          ownerId: owner?.id ?? session.userId,
          score: computeProspectScore({
            email: row.email,
            phone: row.phone,
            whatsapp: row.whatsapp,
            companyId,
          }).score,
        },
      });
      created += 1;
    } catch (error) {
      failures.push(
        `Ligne ${row.line}: ${error instanceof Error ? error.message : "échec"}`,
      );
    }
  }

  return {
    created,
    createdCompanies,
    skipped: preview.stats.total - accepted.length,
    failures,
    stats: preview.stats,
  };
}

export async function exportProspectsCsv(session: SessionPayload) {
  const prospects = await prisma.prospect.findMany({
    where: orgScope(session),
    include: {
      company: { select: { name: true, industry: true } },
      source: { select: { name: true } },
      owner: { select: { name: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 4000,
  });

  const rows = prospects.map((item) =>
    IMPORT_FIELDS.map((field) => {
      switch (field.key) {
        case "firstName":
          return item.firstName;
        case "lastName":
          return item.lastName;
        case "company":
          return item.company?.name ?? "";
        case "email":
          return item.email ?? "";
        case "phone":
          return item.phone ?? "";
        case "whatsapp":
          return item.whatsapp ?? "";
        case "city":
          return item.city ?? "";
        case "industry":
          return item.company?.industry ?? "";
        case "source":
          return item.source?.name ?? "";
        case "owner":
          return item.owner?.name ?? "";
      }
    }),
  );

  return toCsv(TEMPLATE_HEADERS, rows);
}

export function templateCsv() {
  return toCsv(TEMPLATE_HEADERS, [TEMPLATE_SAMPLE]);
}
