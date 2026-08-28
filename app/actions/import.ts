"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { IMPORT_FIELDS, type ColumnMapping } from "@/lib/import-logic";
import { commitProspectImport, MAX_IMPORT_BYTES, previewProspectImport } from "@/lib/import";
import { PERMISSIONS } from "@/lib/permissions";

export type ImportFormState = {
  error?: string;
  success?: string;
  headers?: string[];
  mapping?: ColumnMapping;
  rows?: Awaited<ReturnType<typeof previewProspectImport>>["rows"];
  stats?: Awaited<ReturnType<typeof previewProspectImport>>["stats"];
};

function mappingFromForm(formData: FormData): ColumnMapping | undefined {
  const mapping: ColumnMapping = {};
  let any = false;
  for (const field of IMPORT_FIELDS) {
    const value = String(formData.get(`map-${field.key}`) ?? "").trim();
    if (value) {
      mapping[field.key] = value;
      any = true;
    }
  }
  return any ? mapping : undefined;
}

async function readCsvText(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choisis un fichier CSV.");
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    throw new Error("Enregistre le fichier en CSV (Excel : Fichier → Enregistrer sous → CSV).");
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("Fichier trop volumineux (1,5 Mo max).");
  }
  return file.text();
}

export async function previewImportAction(
  _prev: ImportFormState,
  formData: FormData,
): Promise<ImportFormState> {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  try {
    const text = await readCsvText(formData);
    const preview = await previewProspectImport(session, text, mappingFromForm(formData));
    return {
      headers: preview.headers,
      mapping: preview.mapping,
      rows: preview.rows,
      stats: preview.stats,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible d’analyser le fichier." };
  }
}

export async function commitImportAction(
  _prev: ImportFormState,
  formData: FormData,
): Promise<ImportFormState> {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  try {
    const text = await readCsvText(formData);
    const skipDuplicates = formData.get("skipDuplicates") !== "no";
    const result = await commitProspectImport(session, text, mappingFromForm(formData), {
      skipDuplicates,
    });
    await auditAs(session, {
      action: "prospect.import",
      entity: "Prospect",
      summary: `Import CSV : ${result.created} prospects, ${result.createdCompanies} entreprises`,
    });
    revalidatePath("/prospects");
    revalidatePath("/entreprises");
    revalidatePath("/");
    revalidatePath("/import");
    const extra = result.failures.length ? ` ${result.failures.slice(0, 3).join(" ")}` : "";
    return {
      success: `${result.created} prospect${result.created > 1 ? "s" : ""} importé${result.created > 1 ? "s" : ""}, ${result.createdCompanies} entreprise${result.createdCompanies > 1 ? "s" : ""} créée${result.createdCompanies > 1 ? "s" : ""}, ${result.skipped} ignoré${result.skipped > 1 ? "s" : ""}.${extra}`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible d’importer le fichier." };
  }
}
