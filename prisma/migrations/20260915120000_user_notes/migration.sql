-- CreateTable
CREATE TABLE IF NOT EXISTS "UserNote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserNote_ownerId_updatedAt_idx" ON "UserNote"("ownerId", "updatedAt");
CREATE INDEX IF NOT EXISTS "UserNote_organizationId_idx" ON "UserNote"("organizationId");

ALTER TABLE "UserNote" DROP CONSTRAINT IF EXISTS "UserNote_organizationId_fkey";
ALTER TABLE "UserNote" ADD CONSTRAINT "UserNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserNote" DROP CONSTRAINT IF EXISTS "UserNote_ownerId_fkey";
ALTER TABLE "UserNote" ADD CONSTRAINT "UserNote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
