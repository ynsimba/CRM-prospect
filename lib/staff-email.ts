export const STAFF_EMAIL_DOMAIN = "safecheck-rdc.com";
export const STAFF_EMAIL_EXAMPLE = "p.nom@safecheck-rdc.com";
export const STAFF_EMAIL_PATTERN = /^[a-z]\.[a-z]+(?:[.-][a-z]+)*@safecheck-rdc\.com$/;

export function normalizeStaffEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isStaffEmail(value: string) {
  return STAFF_EMAIL_PATTERN.test(normalizeStaffEmail(value));
}

export function staffEmailMessage() {
  return `L’e-mail doit être du type ${STAFF_EMAIL_EXAMPLE}`;
}

function emailSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Convention Safecheck : initiale du prénom + "." + nom — « Paul Nom » → p.nom@safecheck-rdc.com. */
export function staffEmailFromName(firstName: string, lastName: string) {
  const initial = emailSlug(firstName).charAt(0);
  const last = emailSlug(lastName);
  if (!initial || !last) return "";
  return `${initial}.${last}@${STAFF_EMAIL_DOMAIN}`;
}
