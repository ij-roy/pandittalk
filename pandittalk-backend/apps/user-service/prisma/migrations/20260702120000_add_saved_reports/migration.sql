-- CreateTable
CREATE TABLE "saved_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "input_summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "coins_spent" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_reports_user_id_created_at_idx" ON "saved_reports"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
