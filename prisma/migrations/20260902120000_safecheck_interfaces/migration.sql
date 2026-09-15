-- AlterTable
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "civility" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "displayCode" TEXT;

-- AlterTable
ALTER TABLE "ProspectStatusHistory" ADD COLUMN IF NOT EXISTS "displayCode" TEXT;

-- Backfill readable IDs (ENT / CTC / HIST / ACT)
WITH numbered_companies AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "organizationId" ORDER BY "createdAt") AS n
  FROM "Company"
)
UPDATE "Company" c
SET "displayCode" = 'ENT-' || LPAD(n.n::text, 3, '0')
FROM numbered_companies n
WHERE c.id = n.id AND (c."displayCode" IS NULL OR c."displayCode" = '');

WITH numbered_prospects AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "organizationId" ORDER BY "createdAt") AS n
  FROM "Prospect"
)
UPDATE "Prospect" p
SET "displayCode" = 'ENT-' || LPAD(n.n::text, 3, '0')
FROM numbered_prospects n
WHERE p.id = n.id AND (p."displayCode" IS NULL OR p."displayCode" = '');

WITH numbered_contacts AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "organizationId" ORDER BY "createdAt") AS n
  FROM "Contact"
)
UPDATE "Contact" c
SET "displayCode" = 'CTC-' || LPAD(n.n::text, 3, '0')
FROM numbered_contacts n
WHERE c.id = n.id AND (c."displayCode" IS NULL OR c."displayCode" = '');

WITH numbered_history AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "organizationId" ORDER BY "occurredAt") AS n
  FROM "ProspectStatusHistory"
)
UPDATE "ProspectStatusHistory" h
SET "displayCode" = 'HIST-' || LPAD(n.n::text, 3, '0')
FROM numbered_history n
WHERE h.id = n.id AND (h."displayCode" IS NULL OR h."displayCode" = '');

WITH numbered_tasks AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "organizationId" ORDER BY "createdAt") AS n
  FROM "Task"
)
UPDATE "Task" t
SET "displayCode" = 'ACT-' || LPAD(n.n::text, 3, '0')
FROM numbered_tasks n
WHERE t.id = n.id AND (t."displayCode" IS NULL OR t."displayCode" = '');
