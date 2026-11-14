-- Persist user→pandit blocks for Guideline 1.2 / marketplace safety (#317).
CREATE TABLE "user_pandit_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "pandit_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pandit_blocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_pandit_blocks_user_id_pandit_id_key" ON "user_pandit_blocks"("user_id", "pandit_id");
CREATE INDEX "user_pandit_blocks_user_id_created_at_idx" ON "user_pandit_blocks"("user_id", "created_at" DESC);

ALTER TABLE "user_pandit_blocks" ADD CONSTRAINT "user_pandit_blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_pandit_blocks" ADD CONSTRAINT "user_pandit_blocks_pandit_id_fkey" FOREIGN KEY ("pandit_id") REFERENCES "pandits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
