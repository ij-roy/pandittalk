ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "session_model" TEXT NOT NULL DEFAULT 'legacy_timed';
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL,
  "booking_reminders" BOOLEAN NOT NULL DEFAULT true, "session_updates" BOOLEAN NOT NULL DEFAULT true,
  "messages" BOOLEAN NOT NULL DEFAULT true, "marketing" BOOLEAN NOT NULL DEFAULT false,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "saved_contexts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "text" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1, "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_contexts_pkey" PRIMARY KEY ("id"), CONSTRAINT "saved_contexts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "saved_contexts_user_id_updated_at_idx" ON "saved_contexts"("user_id", "updated_at" DESC);
CREATE TABLE IF NOT EXISTS "saved_context_shares" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "context_id" UUID NOT NULL, "booking_id" UUID NOT NULL,
  "pandit_id" UUID NOT NULL, "context_version" INTEGER NOT NULL, "revoked_at" TIMESTAMPTZ(6), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_context_shares_pkey" PRIMARY KEY ("id"), CONSTRAINT "saved_context_shares_context_id_booking_id_key" UNIQUE ("context_id", "booking_id"),
  CONSTRAINT "saved_context_shares_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "saved_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "saved_context_shares_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "saved_context_shares_booking_id_pandit_id_idx" ON "saved_context_shares"("booking_id", "pandit_id");
CREATE TABLE IF NOT EXISTS "support_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID, "email" TEXT, "category" TEXT NOT NULL, "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'received', "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id"), CONSTRAINT "support_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "support_requests_user_id_created_at_idx" ON "support_requests"("user_id", "created_at" DESC);
CREATE TABLE IF NOT EXISTS "pandit_applications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "phone" TEXT NOT NULL, "email" TEXT, "practice" TEXT NOT NULL,
  "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "message" TEXT, "consent" BOOLEAN NOT NULL, "status" TEXT NOT NULL DEFAULT 'received',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pandit_applications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "pandit_applications_created_at_idx" ON "pandit_applications"("created_at" DESC);
CREATE TABLE IF NOT EXISTS "phone_change_challenges" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "phone_number" TEXT NOT NULL, "otp_hash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0, "expires_at" TIMESTAMPTZ(6) NOT NULL, "verified_at" TIMESTAMPTZ(6), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phone_change_challenges_pkey" PRIMARY KEY ("id"), CONSTRAINT "phone_change_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "phone_change_challenges_user_id_expires_at_idx" ON "phone_change_challenges"("user_id", "expires_at");
