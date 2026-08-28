import { OpportunityStatus } from "@prisma/client";

export function opportunityStatusFromStage(stage: { isWon: boolean; isLost: boolean }): OpportunityStatus {
  if (stage.isWon) return OpportunityStatus.WON;
  if (stage.isLost) return OpportunityStatus.LOST;
  return OpportunityStatus.OPEN;
}

export function weightedAmount(amount: number, probability: number) {
  return Math.round((amount * Math.max(0, Math.min(100, probability))) / 100);
}

export function parseFcAmount(raw: string) {
  const digits = raw.replace(/\s/g, "").replace(/,/g, "");
  if (!digits || !/^\d+$/.test(digits)) {
    throw new Error("Le montant doit être un entier en FC.");
  }
  return Number(digits);
}

export function stagePillClass(stage: { isWon: boolean; isLost: boolean }) {
  if (stage.isWon) return "on";
  if (stage.isLost) return "off";
  return "warn";
}
