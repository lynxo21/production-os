-- AlterTable
ALTER TABLE "crew_members" ADD COLUMN     "hired_before" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "worked_with_before" BOOLEAN NOT NULL DEFAULT false;
