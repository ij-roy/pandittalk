CREATE TABLE "pandit_follows" (
    "user_id" UUID NOT NULL,
    "pandit_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pandit_follows_pkey" PRIMARY KEY ("user_id","pandit_id")
);

CREATE INDEX "pandit_follows_user_id_created_at_idx" ON "pandit_follows"("user_id", "created_at" DESC);

ALTER TABLE "pandit_follows" ADD CONSTRAINT "pandit_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pandit_follows" ADD CONSTRAINT "pandit_follows_pandit_id_fkey" FOREIGN KEY ("pandit_id") REFERENCES "pandits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
