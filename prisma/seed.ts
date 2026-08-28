import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getAllPermissions, getPermissionsForRole } from "../lib/permissions";
import {
  DEFAULT_PIPELINE_STAGES,
  DEFAULT_SOURCES,
  DEFAULT_STATUSES,
  DEFAULT_TAGS,
} from "../lib/crm-defaults";
import { seedDemoCrm } from "./demo-crm";

const prisma = new PrismaClient();

async function main() {
  const permissions = getAllPermissions();
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { label: permission.label },
      create: permission,
    });
  }

  for (const role of Object.values(Role)) {
    const codes = getPermissionsForRole(role);
    for (const code of codes) {
      await prisma.rolePermission.upsert({
        where: { role_permissionCode: { role, permissionCode: code } },
        update: {},
        create: { role, permissionCode: code },
      });
    }
  }

  await prisma.plan.upsert({
    where: { code: "starter" },
    update: { name: "Starter", maxUsers: 2, maxProspects: 1000, maxPipelines: 1 },
    create: { code: "starter", name: "Starter", maxUsers: 2, maxProspects: 1000, maxPipelines: 1 },
  });
  const business = await prisma.plan.upsert({
    where: { code: "business" },
    update: { name: "Business", maxUsers: 10, maxProspects: 10000, maxPipelines: 5 },
    create: { code: "business", name: "Business", maxUsers: 10, maxProspects: 10000, maxPipelines: 5 },
  });
  await prisma.plan.upsert({
    where: { code: "enterprise" },
    update: { name: "Enterprise", maxUsers: 0, maxProspects: 0, maxPipelines: 0 },
    create: { code: "enterprise", name: "Enterprise", maxUsers: 0, maxProspects: 0, maxPipelines: 0 },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "prospect-demo" },
    update: { name: "Prospect CRM Demo" },
    create: {
      name: "Prospect CRM Demo",
      slug: "prospect-demo",
      currency: "CDF",
      timezone: "Africa/Kinshasa",
      phone: "+243 810 000 001",
      website: "https://prospect.cd",
    },
  });

  await ensureDefaults(organization.id);

  await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: { planId: business.id, status: "TRIALING" },
    create: {
      organizationId: organization.id,
      planId: business.id,
      status: "TRIALING",
    },
  });

  const users = [
    { email: "admin@demo.cd", name: "Amina Kalala", role: Role.OWNER, password: "admin123" },
    { email: "manager@demo.cd", name: "Paul Ilunga", role: Role.MANAGER, password: "manager123" },
    { email: "jean@demo.cd", name: "Neisse ENGANI", role: Role.SALES, password: "jean123" },
    { email: "marie@demo.cd", name: "Marie Kabila", role: Role.SALES, password: "marie123" },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: {
        organizationId_email: { organizationId: organization.id, email: user.email },
      },
      update: { passwordHash, name: user.name, role: user.role, isActive: true },
      create: {
        organizationId: organization.id,
        email: user.email,
        passwordHash,
        name: user.name,
        role: user.role,
      },
    });
  }

  await seedDemoCrm(prisma, organization.id);

  const platform = await prisma.organization.upsert({
    where: { slug: "prospect-saas" },
    update: {},
    create: { name: "Prospect CRM", slug: "prospect-saas", currency: "CDF" },
  });

  const superHash = await bcrypt.hash("super123", 10);
  await prisma.user.upsert({
    where: {
      organizationId_email: { organizationId: platform.id, email: "super@prospect.cd" },
    },
    update: { passwordHash: superHash, role: Role.SUPER_ADMIN },
    create: {
      organizationId: platform.id,
      email: "super@prospect.cd",
      passwordHash: superHash,
      name: "Super Admin",
      role: Role.SUPER_ADMIN,
    },
  });
}

async function ensureDefaults(organizationId: string) {
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
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
