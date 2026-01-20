/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `business_units` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "business_units" ADD COLUMN     "code" TEXT,
ADD COLUMN     "leader_name" TEXT,
ADD COLUMN     "staff_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE UNIQUE INDEX "business_units_code_key" ON "business_units"("code");
