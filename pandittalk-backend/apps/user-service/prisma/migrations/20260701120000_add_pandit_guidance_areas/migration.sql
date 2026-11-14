-- AlterTable
ALTER TABLE "pandits" ADD COLUMN "guidance_areas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
