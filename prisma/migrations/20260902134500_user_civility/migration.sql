-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "civility" TEXT;

UPDATE "User" SET "civility" = 'Mme'
WHERE "name" IN ('Amina Kalala', 'Neisse ENGANI', 'Marie Kabila')
  AND ("civility" IS NULL OR "civility" = '');

UPDATE "User" SET "civility" = 'Mr'
WHERE "name" IN ('Paul Ilunga')
  AND ("civility" IS NULL OR "civility" = '');
