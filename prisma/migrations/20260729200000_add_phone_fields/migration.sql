-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "phone" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Admin_phone_key" ON "Admin"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_phone_key" ON "Staff"("phone");
