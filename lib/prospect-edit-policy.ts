import { isDirectionRole, isSalesRole } from "@/lib/roles";
import type { Role } from "@/lib/enums";

/** Champs de fiche que le commercial peut compléter s’ils sont vides. */
export const PROSPECT_PROFILE_FIELDS = [
  "jobTitle",
  "email",
  "phone",
  "whatsapp",
  "city",
  "address",
  "industry",
  "companySize",
  "notes",
  "firstContactAt",
  "nextContactAt",
] as const;

export type ProspectProfileField = (typeof PROSPECT_PROFILE_FIELDS)[number];

export type ProspectProfileValues = Partial<Record<ProspectProfileField, string | Date | null | undefined>>;

const FIELD_LABELS: Record<ProspectProfileField, string> = {
  jobTitle: "Fonction",
  email: "E-mail",
  phone: "Téléphone",
  whatsapp: "WhatsApp",
  city: "Ville",
  address: "Adresse",
  industry: "Secteur",
  companySize: "Taille",
  notes: "Notes",
  firstContactAt: "Date premier contact",
  nextContactAt: "Date RDV",
};

export function isBlankField(value: unknown): boolean {
  if (value == null) return true;
  if (value instanceof Date) return Number.isNaN(value.getTime());
  const text = String(value).trim();
  return text.length === 0 || text === "—";
}

export function isProspectIncomplete(values: ProspectProfileValues): boolean {
  return PROSPECT_PROFILE_FIELDS.some((field) => isBlankField(values[field]));
}

export function canFullyEditProspect(role?: Role): boolean {
  return isDirectionRole(role);
}

export function lockedProspectFields(
  role: Role | undefined,
  values: ProspectProfileValues,
): ProspectProfileField[] {
  if (canFullyEditProspect(role)) return [];
  if (!isSalesRole(role)) return [...PROSPECT_PROFILE_FIELDS];
  return PROSPECT_PROFILE_FIELDS.filter((field) => !isBlankField(values[field]));
}

export function emptyProspectFields(values: ProspectProfileValues): ProspectProfileField[] {
  return PROSPECT_PROFILE_FIELDS.filter((field) => isBlankField(values[field]));
}

/**
 * Pour un commercial : n’accepte que le remplissage des champs encore vides.
 * La direction : accepte tout le patch.
 */
export function filterProspectProfilePatch(
  role: Role | undefined,
  current: ProspectProfileValues,
  patch: ProspectProfileValues,
): ProspectProfileValues {
  const next: ProspectProfileValues = {};

  for (const field of PROSPECT_PROFILE_FIELDS) {
    if (!(field in patch) || patch[field] === undefined) continue;
    const incoming = patch[field] ?? null;

    if (canFullyEditProspect(role)) {
      next[field] = incoming;
      continue;
    }

    if (!isSalesRole(role)) {
      throw new Error("Tu n’as pas le droit de modifier cette fiche.");
    }

    if (!isBlankField(current[field])) {
      if (normalizeComparable(current[field]) !== normalizeComparable(incoming)) {
        throw new Error(
          `Le champ « ${FIELD_LABELS[field]} » est déjà renseigné. Seule la direction peut le modifier.`,
        );
      }
      continue;
    }

    if (isBlankField(incoming)) continue;
    next[field] = incoming;
  }

  return next;
}

function normalizeComparable(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  return String(value).trim().toLowerCase();
}

export function profileFieldLabel(field: ProspectProfileField): string {
  return FIELD_LABELS[field];
}
