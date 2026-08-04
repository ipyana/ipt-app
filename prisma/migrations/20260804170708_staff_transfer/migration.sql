-- CreateTable
CREATE TABLE "StaffTransferRequest" (
    "id" SERIAL NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "from_cluster_id" INTEGER NOT NULL,
    "to_cluster_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "review_notes" TEXT,
    "reviewed_by_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffTransferRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StaffTransferRequest" ADD CONSTRAINT "StaffTransferRequest_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
