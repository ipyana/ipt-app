/*
  Warnings:

  - You are about to drop the `ClusterProgram` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClusterProgram" DROP CONSTRAINT "ClusterProgram_cluster_id_fkey";

-- DropForeignKey
ALTER TABLE "ClusterProgram" DROP CONSTRAINT "ClusterProgram_program_id_fkey";

-- DropTable
DROP TABLE "ClusterProgram";

-- CreateTable
CREATE TABLE "ClusterDepartment" (
    "cluster_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "slots" INTEGER NOT NULL DEFAULT 0,
    "enrolled" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClusterDepartment_pkey" PRIMARY KEY ("cluster_id","department_id")
);

-- AddForeignKey
ALTER TABLE "ClusterDepartment" ADD CONSTRAINT "ClusterDepartment_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClusterDepartment" ADD CONSTRAINT "ClusterDepartment_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
