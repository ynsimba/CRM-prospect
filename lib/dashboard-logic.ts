export const DORMANT_DAYS = 60;
export const PIPELINE_GOAL = 70;

export function inactivityAnchor(lastContactAt: Date | null, createdAt: Date) {
  return lastContactAt ?? createdAt;
}

export function isDormantProspect(
  input: {
    lastContactAt: Date | null;
    createdAt: Date;
    isConverted?: boolean;
    isLost?: boolean;
  },
  now = new Date(),
  days = DORMANT_DAYS,
) {
  if (input.isConverted || input.isLost) return false;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return inactivityAnchor(input.lastContactAt, input.createdAt).getTime() < cutoff.getTime();
}

export function dormantWhere(now = new Date(), days = DORMANT_DAYS) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return {
    status: { isConverted: false, isLost: false },
    OR: [{ lastContactAt: { lt: cutoff } }, { lastContactAt: null, createdAt: { lt: cutoff } }],
  };
}
