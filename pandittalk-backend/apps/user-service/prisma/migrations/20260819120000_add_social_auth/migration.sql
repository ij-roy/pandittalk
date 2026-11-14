-- AlterTable
ALTER TABLE "users" ADD COLUMN "google_sub" TEXT;
ALTER TABLE "users" ADD COLUMN "apple_sub" TEXT;

-- Empty strings collide on a unique email index; treat them as unset.
UPDATE "users" SET "email" = NULL WHERE "email" IS NOT NULL AND btrim("email") = '';

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");
CREATE UNIQUE INDEX "users_apple_sub_key" ON "users"("apple_sub");
