export const STAFF_EMAIL_DOMAIN = "safecheck-rdc.com";
export const STAFF_EMAIL_EXAMPLE = "n.engani@safecheck-rdc.com";
export const STAFF_EMAIL_PATTERN = /^[a-z]\.[a-z]+(?:[.-][a-z]+)*@safecheck-rdc\.com$/;

export const DEMO_STAFF_EMAILS = {
  admin: { email: "a.kalala@safecheck-rdc.com", aliases: ["admin@demo.cd"] },
  direction: { email: "f.balumene@safecheck-rdc.com", aliases: ["manager@demo.cd", "p.ilunga@safecheck-rdc.com"] },
  jean: { email: "n.engani@safecheck-rdc.com", aliases: ["jean@demo.cd"] },
  marie: { email: "n.kandolo@safecheck-rdc.com", aliases: ["marie@demo.cd", "m.kabila@safecheck-rdc.com"] },
} as const;

export function normalizeStaffEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isStaffEmail(value: string) {
  return STAFF_EMAIL_PATTERN.test(normalizeStaffEmail(value));
}

export function staffEmailMessage() {
  return `L’e-mail doit être du type ${STAFF_EMAIL_EXAMPLE}`;
}

export function demoStaffLookupEmails(key: keyof typeof DEMO_STAFF_EMAILS) {
  const item = DEMO_STAFF_EMAILS[key];
  return [item.email, ...item.aliases];
}
