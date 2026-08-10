-- AlterTable
ALTER TABLE "ClusterDepartment" ADD COLUMN     "phase2_enrolled" INTEGER NOT NULL DEFAULT 0;

-- Backfill phase2_enrolled from actual phase-2 allocations per cluster + student department.
-- Each phase-2 allocation occupies one phase-2 slot in that cluster for the student's department.
UPDATE "ClusterDepartment" cd
SET "phase2_enrolled" = sub.cnt
FROM (
  SELECT cd2."cluster_id", s."department" AS dept, count(*) AS cnt
  FROM "PhaseAllocation" pa
  JOIN "Phase" p ON p.id = pa."phase_id"
  JOIN "Application" a ON a.id = pa."application_id"
  JOIN "Student" s ON s.id = a."student_id"
  JOIN "ClusterDepartment" cd2 ON cd2."cluster_id" = pa."cluster_id"
  WHERE p."phase_number" = 2
  GROUP BY cd2."cluster_id", s."department"
) sub
WHERE cd."cluster_id" = sub."cluster_id"
  AND cd."department_id" = (SELECT id FROM "Department" WHERE "abbreviation" = sub.dept);

-- AlterTable
ALTER TABLE "TransferRequest" ADD COLUMN     "replace_cluster_id" INTEGER;
