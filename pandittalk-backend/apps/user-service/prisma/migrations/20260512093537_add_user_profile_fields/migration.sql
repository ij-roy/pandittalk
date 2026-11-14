-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" TEXT,
ADD COLUMN     "current_address" TEXT,
ADD COLUMN     "dob" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "marital_status" TEXT,
ADD COLUMN     "place_of_birth" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "profile_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "time_of_birth" TEXT;
