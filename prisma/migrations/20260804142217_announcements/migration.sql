-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "cluster_id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachment_url" TEXT,
    "attachment_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRead" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_cluster_id_created_at_idx" ON "Announcement"("cluster_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRead_announcement_id_student_id_key" ON "AnnouncementRead"("announcement_id", "student_id");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
