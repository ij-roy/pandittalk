-- Legal consent fields captured when the user accepts Terms + Privacy at login OTP verify.
ALTER TABLE "users" ADD COLUMN "accepted_age_18" BOOLEAN;
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN "privacy_accepted_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN "terms_version" TEXT;
ALTER TABLE "users" ADD COLUMN "privacy_version" TEXT;
