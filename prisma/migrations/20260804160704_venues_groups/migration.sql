-- AlterTable
ALTER TABLE "PhaseAllocation" ADD COLUMN     "group_id" INTEGER;

-- CreateTable
CREATE TABLE "Venue" (
    "id" SERIAL NOT NULL,
    "cluster_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "cluster_id" INTEGER NOT NULL,
    "phase_id" INTEGER,
    "venue_id" INTEGER,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Venue_cluster_id_name_key" ON "Venue"("cluster_id", "name");

-- AddForeignKey
ALTER TABLE "PhaseAllocation" ADD CONSTRAINT "PhaseAllocation_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
