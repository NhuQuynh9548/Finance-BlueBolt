-- AlterEnum
ALTER TYPE "object_type" ADD VALUE 'STUDENT';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "student_name" TEXT;
