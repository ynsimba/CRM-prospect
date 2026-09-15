-- AlterTable
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "displayCode" TEXT;

-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN IF NOT EXISTS "statusComment" TEXT;
ALTER TABLE "Prospect" ADD COLUMN IF NOT EXISTS "displayCode" TEXT;
ALTER TABLE "Prospect" ADD COLUMN IF NOT EXISTS "firstContactAt" TIMESTAMP(3);
ALTER TABLE "Prospect" ADD COLUMN IF NOT EXISTS "lastActionAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assignedById" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "displayCode" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "directorNote" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "ownerNote" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProspectStatusHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "actorId" TEXT,
    "statusName" TEXT NOT NULL,
    "statusSlug" TEXT NOT NULL,
    "comment" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProspectStatusHistory_organizationId_occurredAt_idx" ON "ProspectStatusHistory"("organizationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "ProspectStatusHistory_prospectId_occurredAt_idx" ON "ProspectStatusHistory"("prospectId", "occurredAt");

-- Backfill action dates
UPDATE "Prospect"
SET "lastActionAt" = COALESCE("lastContactAt", "updatedAt")
WHERE "lastActionAt" IS NULL;

UPDATE "Prospect"
SET "firstContactAt" = "lastContactAt"
WHERE "firstContactAt" IS NULL AND "lastContactAt" IS NOT NULL;

-- Ensure Safecheck statuses exist
INSERT INTO "ProspectStatus" ("id", "organizationId", "name", "slug", "sortOrder", "isConverted", "isLost")
SELECT
  'sc_' || s.slug || '_' || o."id",
  o."id",
  s.name,
  s.slug,
  s.sort_order,
  s.is_converted,
  s.is_lost
FROM "Organization" o
CROSS JOIN (
  VALUES
    ('Opportunité', 'opportunite', 0, false, false),
    ('Lead', 'lead', 1, false, false),
    ('Pipeline', 'pipeline', 2, false, false),
    ('Rejeté', 'rejete', 3, false, true),
    ('Finalisé', 'finalise', 4, true, false)
) AS s(name, slug, sort_order, is_converted, is_lost)
WHERE NOT EXISTS (
  SELECT 1 FROM "ProspectStatus" ps
  WHERE ps."organizationId" = o."id" AND ps."slug" = s.slug
);

-- Remap legacy slugs
UPDATE "Prospect" p
SET "statusId" = ns."id"
FROM "ProspectStatus" os
JOIN "ProspectStatus" ns
  ON ns."organizationId" = os."organizationId"
 AND ns."slug" = CASE os."slug"
    WHEN 'nouveau' THEN 'opportunite'
    WHEN 'a-contacter' THEN 'opportunite'
    WHEN 'contacte' THEN 'lead'
    WHEN 'reponse' THEN 'lead'
    WHEN 'qualifie' THEN 'pipeline'
    WHEN 'en-attente' THEN 'pipeline'
    WHEN 'non-qualifie' THEN 'rejete'
    WHEN 'perdu' THEN 'rejete'
    WHEN 'converti' THEN 'finalise'
    ELSE os."slug"
  END
WHERE p."statusId" = os."id"
  AND os."slug" NOT IN ('opportunite', 'lead', 'pipeline', 'rejete', 'finalise');

DELETE FROM "ProspectStatus"
WHERE "slug" NOT IN ('opportunite', 'lead', 'pipeline', 'rejete', 'finalise')
  AND NOT EXISTS (SELECT 1 FROM "Prospect" p WHERE p."statusId" = "ProspectStatus"."id");

-- Foreign keys
ALTER TABLE "ProspectStatusHistory" DROP CONSTRAINT IF EXISTS "ProspectStatusHistory_organizationId_fkey";
ALTER TABLE "ProspectStatusHistory" ADD CONSTRAINT "ProspectStatusHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProspectStatusHistory" DROP CONSTRAINT IF EXISTS "ProspectStatusHistory_prospectId_fkey";
ALTER TABLE "ProspectStatusHistory" ADD CONSTRAINT "ProspectStatusHistory_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProspectStatusHistory" DROP CONSTRAINT IF EXISTS "ProspectStatusHistory_statusId_fkey";
ALTER TABLE "ProspectStatusHistory" ADD CONSTRAINT "ProspectStatusHistory_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "ProspectStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProspectStatusHistory" DROP CONSTRAINT IF EXISTS "ProspectStatusHistory_actorId_fkey";
ALTER TABLE "ProspectStatusHistory" ADD CONSTRAINT "ProspectStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_assignedById_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
