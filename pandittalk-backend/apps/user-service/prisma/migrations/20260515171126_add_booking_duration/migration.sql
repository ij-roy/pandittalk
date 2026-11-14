/*
  Warnings:

  - Added the required column `duration_minutes` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "duration_minutes" INTEGER NOT NULL;
