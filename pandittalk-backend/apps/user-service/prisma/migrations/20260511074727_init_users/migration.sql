-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone_number" TEXT NOT NULL,
    "name" TEXT,
    "wallet_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
