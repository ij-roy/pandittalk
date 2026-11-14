-- CreateTable
CREATE TABLE "pandit_availability" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pandit_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "window_start" TEXT NOT NULL,
    "window_end" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pandit_availability_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pandit_availability" ADD CONSTRAINT "pandit_availability_pandit_id_fkey" FOREIGN KEY ("pandit_id") REFERENCES "pandits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: add new time columns (nullable for backfill)
ALTER TABLE "bookings" ADD COLUMN "start_time" TIMESTAMPTZ(6),
ADD COLUMN "end_time" TIMESTAMPTZ(6),
ADD COLUMN "buffer_end_time" TIMESTAMPTZ(6);

-- Backfill from slots
UPDATE "bookings" b
SET
    "start_time" = s."date",
    "end_time" = s."date" + (b."duration_minutes" * INTERVAL '1 minute'),
    "buffer_end_time" = s."date" + (b."duration_minutes" * INTERVAL '1 minute') + INTERVAL '5 minutes'
FROM "slots" s
WHERE b."slot_id" = s."id";

-- Enforce NOT NULL on new columns
ALTER TABLE "bookings" ALTER COLUMN "start_time" SET NOT NULL,
ALTER COLUMN "end_time" SET NOT NULL,
ALTER COLUMN "buffer_end_time" SET NOT NULL;

-- Drop slot relation from bookings
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_slot_id_fkey";
DROP INDEX "bookings_slot_id_key";
ALTER TABLE "bookings" DROP COLUMN "slot_id";

-- DropTable
DROP TABLE "slots";
