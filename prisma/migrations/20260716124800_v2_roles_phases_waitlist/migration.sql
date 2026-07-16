/*
  Warnings:

  - Added the required column `password` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "waitlisted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'staff';

-- CreateTable
CREATE TABLE "IptSession" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "weeks_per_phase" INTEGER NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IptSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "phase_number" INTEGER NOT NULL,
    "cluster_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhaseAllocation" (
    "id" SERIAL NOT NULL,
    "phase_id" INTEGER NOT NULL,
    "application_id" INTEGER NOT NULL,
    "cluster_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhaseAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "cluster_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Phase_session_id_phase_number_cluster_id_key" ON "Phase"("session_id", "phase_number", "cluster_id");

-- CreateIndex
CREATE UNIQUE INDEX "PhaseAllocation_application_id_phase_id_key" ON "PhaseAllocation"("application_id", "phase_id");

-- CreateIndex
CREATE INDEX "WaitlistEntry_cluster_id_status_position_idx" ON "WaitlistEntry"("cluster_id", "status", "position");

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "IptSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "Cluster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseAllocation" ADD CONSTRAINT "PhaseAllocation_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseAllocation" ADD CONSTRAINT "PhaseAllocation_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
