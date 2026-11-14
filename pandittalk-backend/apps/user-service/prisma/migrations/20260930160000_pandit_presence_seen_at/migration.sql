-- Drop the online flag when the pandit dashboard stops heartbeating.
ALTER TABLE "pandits" ADD COLUMN "presence_seen_at" TIMESTAMPTZ(6);
