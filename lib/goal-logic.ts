export function goalProgress(actual: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((actual / Math.max(0, target)) * 100));
}

export function compareReps(
  a: { wonRevenue: number; prospects: number; meetings: number },
  b: { wonRevenue: number; prospects: number; meetings: number },
) {
  return b.wonRevenue - a.wonRevenue || b.prospects - a.prospects || b.meetings - a.meetings;
}

export function parseTargetInt(raw: string, label: string) {
  const digits = raw.replace(/\s/g, "");
  if (!digits) return 0;
  if (!/^\d+$/.test(digits)) {
    throw new Error(`${label} doit être un entier.`);
  }
  return Number(digits);
}
