-- Remote push device tokens (Expo / APNs / FCM) for session reminders when app is killed.
CREATE TABLE IF NOT EXISTS "push_devices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_devices_token_key" ON "push_devices"("token");
CREATE INDEX IF NOT EXISTS "push_devices_user_id_idx" ON "push_devices"("user_id");

ALTER TABLE "push_devices"
  ADD CONSTRAINT "push_devices_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
