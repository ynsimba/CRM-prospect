import "server-only";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PIPELINE_STAGES,
  DEFAULT_SOURCES,
  DEFAULT_STATUSES,
  DEFAULT_TAGS,
} from "@/lib/crm-defaults";

export async function ensureOrgDefaults(organizationId: string) {
  for (const status of DEFAULT_STATUSES) {
    await prisma.prospectStatus.upsert({
      where: { organizationId_slug: { organizationId, slug: status.slug } },
      update: { name: status.name, sortOrder: status.sortOrder },
      create: { organizationId, ...status },
    });
  }

  for (const source of DEFAULT_SOURCES) {
    await prisma.prospectSource.upsert({
      where: { organizationId_slug: { organizationId, slug: source.slug } },
      update: { name: source.name },
      create: { organizationId, ...source },
    });
  }

  for (const name of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { organizationId_name: { organizationId, name } },
      update: {},
      create: { organizationId, name },
    });
  }

  const pipeline = await prisma.pipeline.upsert({
    where: { organizationId_name: { organizationId, name: "Pipeline commercial" } },
    update: { isDefault: true },
    create: { organizationId, name: "Pipeline commercial", isDefault: true },
  });

  for (const stage of DEFAULT_PIPELINE_STAGES) {
    const existing = await prisma.pipelineStage.findFirst({
      where: { pipelineId: pipeline.id, name: stage.name },
    });
    if (existing) {
      await prisma.pipelineStage.update({
        where: { id: existing.id },
        data: {
          sortOrder: stage.sortOrder,
          probability: stage.probability,
          isWon: stage.isWon,
          isLost: stage.isLost,
        },
      });
    } else {
      await prisma.pipelineStage.create({
        data: { pipelineId: pipeline.id, ...stage },
      });
    }
  }

  return pipeline;
}
