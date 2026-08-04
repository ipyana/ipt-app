import { prisma } from "@/lib/db";

export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Atomically reserves one department slot for a cluster. Uses a conditional
 * UPDATE so concurrent submissions cannot exceed the slot limit.
 * Returns the ClusterDepartment row (with cluster) or null if the slot is full.
 */
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
