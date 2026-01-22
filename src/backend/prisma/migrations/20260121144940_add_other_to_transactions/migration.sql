-- AlterEnum
ALTER TYPE "object_type" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "other_name" TEXT;
