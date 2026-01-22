-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "business_unit_id" TEXT;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
