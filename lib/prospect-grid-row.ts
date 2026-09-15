import type { ProspectGridRow } from "@/components/ProspectGrid";
import { fullName } from "@/lib/crm";
import { needsFollowUpAlert, prospectFormulaInput, specLastActionAt } from "@/lib/prospect-list-logic";
import { archivedLabel, dormantLabel, relanceLabel } from "@/lib/safecheck";
import type { listProspects } from "@/lib/prospects";

export function toProspectGridRow(
  prospect: Awaited<ReturnType<typeof listProspects>>[number],
): ProspectGridRow {
  const companyName = prospect.company?.name ?? fullName(prospect.firstName, prospect.lastName);
  const formula = prospectFormulaInput(prospect);
  const lastAction = specLastActionAt(prospect);

  return {
    id: prospect.id,
    href: `/prospects/${prospect.id}`,
    displayCode: prospect.displayCode ?? prospect.company?.displayCode ?? "",
    companyName,
    industry: prospect.company?.industry ?? prospect.industry ?? "",
    address: prospect.company?.address ?? prospect.address ?? "",
    city: prospect.company?.city ?? prospect.city ?? "",
    size: prospect.company?.size ?? prospect.companySize ?? "",
    lastActionAt: lastAction.toISOString(),
    meetingAt: prospect.nextContactAt?.toISOString() ?? null,
    statusId: prospect.statusId,
    statusName: prospect.status.name,
    statusSlug: prospect.status.slug,
    isConverted: prospect.status.isConverted,
    isLost: prospect.status.isLost,
    notes: prospect.statusComment ?? prospect.notes ?? "",
    ownerId: prospect.owner?.id ?? "",
    ownerName: prospect.owner?.name ?? "",
    needsFollowUp: needsFollowUpAlert(formula),
    relanceLabel: relanceLabel(formula),
    dormantLabel: dormantLabel(formula),
    archivedLabel: archivedLabel(formula),
  };
}
