import { ProspectPriority } from "@prisma/client";

export function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export function readOptionalId(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : undefined;
}

export const PRIORITY_LABELS = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  URGENT: "Urgente",
} as const;

export const PERSON_CATEGORIES = [
  { id: "contact", name: "Personne de contact" },
  { id: "porteur", name: "Porteur de projet" },
] as const;

export type PersonCategory = (typeof PERSON_CATEGORIES)[number]["id"];

export function parsePersonCategory(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return PERSON_CATEGORIES.some((item) => item.id === raw) ? (raw as PersonCategory) : undefined;
}

export function personCategoryLabel(value?: string | null) {
  return PERSON_CATEGORIES.find((item) => item.id === value)?.name ?? value ?? "—";
}

export const FOLLOW_UP_STATUS_SLUGS = [
  "a-contacter",
  "contacte",
  "reponse",
  "qualifie",
  "en-attente",
] as const;

export type ProspectFilters = {
  q?: string;
  statusId?: string;
  sourceId?: string;
  ownerId?: string;
  tagId?: string;
  priority?: ProspectPriority;
  city?: string;
  score?: "froid" | "tiede" | "chaud" | "tres-chaud";
  archived?: boolean;
  followUp?: boolean;
  sort?: "updated" | "name" | "company" | "score" | "priority";
};

const PRIORITIES = new Set<string>(Object.values(ProspectPriority));

export function parseProspectFilters(search: {
  q?: string;
  status?: string;
  source?: string;
  owner?: string;
  tag?: string;
  priority?: string;
  city?: string;
  score?: string;
}): ProspectFilters {
  const priority =
    search.priority && PRIORITIES.has(search.priority)
      ? (search.priority as ProspectPriority)
      : undefined;
  const score =
    search.score === "froid" ||
    search.score === "tiede" ||
    search.score === "chaud" ||
    search.score === "tres-chaud"
      ? search.score
      : undefined;

  return {
    q: search.q?.trim() || undefined,
    statusId: search.status || undefined,
    sourceId: search.source || undefined,
    ownerId: search.owner || undefined,
    tagId: search.tag || undefined,
    priority,
    city: search.city?.trim() || undefined,
    score,
  };
}

export function scoreBand(score: number) {
  if (score <= 30) return "Froid";
  if (score <= 60) return "Tiède";
  if (score <= 80) return "Chaud";
  return "Très chaud";
}

export function computeProspectScore(input: {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  companyId?: string | null;
  jobTitle?: string | null;
  priority?: ProspectPriority | string | null;
  tags?: string[];
  statusSlug?: string | null;
  activityTypes?: string[];
  lastContactAt?: Date | null;
  nextContactAt?: Date | null;
  now?: Date;
}) {
  const parts: { label: string; points: number }[] = [];
  const add = (label: string, points: number) => {
    if (points) parts.push({ label, points });
  };

  add("E-mail", input.email?.trim() ? 10 : 0);
  add("Téléphone", input.phone?.trim() ? 10 : 0);
  add("WhatsApp", input.whatsapp?.trim() ? 10 : 0);
  add("Entreprise", input.companyId ? 10 : 0);
  add("Fonction", input.jobTitle?.trim() ? 5 : 0);

  if (input.priority === "HIGH") add("Priorité haute", 10);
  if (input.priority === "URGENT") add("Priorité urgente", 15);

  const tags = input.tags ?? [];
  if (tags.includes("VIP")) add("VIP", 15);
  if (tags.includes("Hot Lead")) add("Hot Lead", 10);
  if (tags.includes("Gros budget")) add("Gros budget", 10);
  if (tags.includes("Urgent")) add("Tag urgent", 5);

  const slug = input.statusSlug ?? "";
  if (slug === "qualifie") add("Qualifié", 15);
  else if (slug === "reponse") add("Réponse reçue", 10);
  else if (slug === "contacte") add("Contacté", 5);
  else if (slug === "converti") add("Converti", 20);
  else if (slug === "perdu" || slug === "non-qualifie") add("Non qualifié / perdu", -20);

  const types = input.activityTypes ?? [];
  const exchanges = types.filter((type) => ["CALL", "EMAIL", "WHATSAPP", "SMS"].includes(type)).length;
  add("Échanges", Math.min(15, exchanges * 5));
  const meetings = types.filter((type) => ["MEETING", "VISIT", "DEMO"].includes(type)).length;
  add("RDV / démo", Math.min(20, meetings * 10));

  const now = input.now ?? new Date();
  if (input.lastContactAt) {
    const days = (now.getTime() - input.lastContactAt.getTime()) / 86_400_000;
    if (days <= 7) add("Contact récent", 10);
  }
  if (input.nextContactAt && input.nextContactAt.getTime() < now.getTime()) {
    add("Relance en retard", -10);
  }

  const score = Math.max(0, Math.min(100, parts.reduce((sum, part) => sum + part.points, 0)));
  return { score, parts };
}

export function computeLeadScore(input: {
  email?: string | null;
  phone?: string | null;
  companyId?: string | null;
}) {
  return computeProspectScore(input).score;
}

export function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function whatsappHref(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function statusPillClass(slug: string, isConverted?: boolean, isLost?: boolean) {
  if (isConverted || slug === "converti" || slug === "qualifie") return "on";
  if (isLost || slug === "perdu" || slug === "non-qualifie") return "off";
  return "warn";
}

export function priorityPillClass(priority: keyof typeof PRIORITY_LABELS) {
  if (priority === "URGENT" || priority === "HIGH") return "off";
  if (priority === "LOW") return "warn";
  return "on";
}
