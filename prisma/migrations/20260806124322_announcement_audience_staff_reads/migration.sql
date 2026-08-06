-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "audience" TEXT NOT NULL DEFAULT 'students',
ALTER COLUMN "cluster_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StaffAnnouncementRead" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffAnnouncementRead_announcement_id_staff_id_key" ON "StaffAnnouncementRead"("announcement_id", "staff_id");

-- AddForeignKey
ALTER TABLE "StaffAnnouncementRead" ADD CONSTRAINT "StaffAnnouncementRead_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAnnouncementRead" ADD CONSTRAINT "StaffAnnouncementRead_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
