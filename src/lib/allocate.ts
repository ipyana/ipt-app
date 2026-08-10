import { prisma } from "@/lib/db";

export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Find the ClusterDepartment row for a student's department in a cluster. */
export async function getStudentDepartmentSlot(
  clusterId: number,
  departmentAbbreviation: string
) {
  return prisma.clusterDepartment.findFirst({
    where: { clusterId, department: { abbreviation: departmentAbbreviation } },
  });
}

export async function reserveDepartmentSlot(
  tx: Tx,
  clusterId: number,
  departmentId: number
): Promise<boolean> {
  const result = await tx.clusterDepartment.updateMany({
    where: { clusterId, departmentId, enrolled: { lt: prisma.clusterDepartment.fields.slots } },
    data: { enrolled: { increment: 1 } },
  });
  if (result.count === 0) return false;
  await tx.cluster.update({
    where: { id: clusterId },
    data: { currentEnrolled: { increment: 1 } },
  });
  return true;
}

/**
 * Reserve a slot for a specific phase on a cluster+department.
 * Phase 1 uses `enrolled`, Phase 2 uses `phase2Enrolled` — each capped by `slots`,
 * so a cluster can host up to `slots` phase-1 students AND up to `slots` phase-2
 * students (sequential phases, different cohorts). Returns false when full.
 */
export async function reservePhaseSlot(
  tx: Tx,
  clusterId: number,
  departmentId: number,
  phaseNumber: number
): Promise<boolean> {
  if (phaseNumber === 2) {
    const result = await tx.clusterDepartment.updateMany({
      where: { clusterId, departmentId, phase2Enrolled: { lt: prisma.clusterDepartment.fields.slots } },
      data: { phase2Enrolled: { increment: 1 } },
    });
    return result.count > 0;
  }
  return reserveDepartmentSlot(tx, clusterId, departmentId);
}

/** Release one slot for a phase on a cluster+department (best-effort, never below 0). */
export async function releasePhaseSlot(
  tx: Tx,
  clusterId: number,
  departmentId: number,
  phaseNumber: number
): Promise<void> {
  const cd = await tx.clusterDepartment.findUnique({
    where: { clusterId_departmentId: { clusterId, departmentId } },
  });
  if (!cd) return;
  if (phaseNumber === 2) {
    if (cd.phase2Enrolled > 0) {
      await tx.clusterDepartment.update({
        where: { clusterId_departmentId: { clusterId, departmentId } },
        data: { phase2Enrolled: { decrement: 1 } },
      });
    }
    return;
  }
  if (cd.enrolled > 0) {
    await tx.clusterDepartment.update({
      where: { clusterId_departmentId: { clusterId, departmentId } },
      data: { enrolled: { decrement: 1 } },
    });
    const cluster = await tx.cluster.findUnique({ where: { id: clusterId } });
    if (cluster && cluster.currentEnrolled > 0) {
      await tx.cluster.update({
        where: { id: clusterId },
        data: { currentEnrolled: { decrement: 1 } },
      });
    }
  }
}
