-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "department" TEXT;
