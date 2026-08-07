import { prisma } from "@/lib/db";

/**
 * Randomly picks a group (venue) for a cluster+phase that still has capacity.
 * - If groups exist: picks a random group where allocations < capacity
 *   (capacity 0 = unlimited). Skips full groups, spilling to the next group.
 * - If no groups exist for the cluster+phase yet, creates one per venue.
 * - Returns the group id, or null when every group for that phase is full
 *   (i.e. the cluster is "NO VACANT" for that phase).
 */
export async function assignGroup(clusterId: number, phaseId: number): Promise<number | null> {
  let groups = await prisma.group.findMany({
    where: { clusterId, phaseId },
    include: { _count: { select: { allocations: true } } },
  });

  if (groups.length === 0) {
    const venues = await prisma.venue.findMany({ where: { clusterId } });
    if (venues.length === 0) {
      const created = await prisma.group.create({
        data: { clusterId, phaseId, name: "Main Group", location: "" },
      });
      return created.id;
    }
    for (const v of venues) {
      await prisma.group.create({
        data: { clusterId, phaseId, venueId: v.id, name: v.name, location: v.name },
      });
    }
    groups = await prisma.group.findMany({
      where: { clusterId, phaseId },
      include: { _count: { select: { allocations: true } } },
    });
  }

  const open = groups.filter(
    (g) => g.capacity === 0 || g._count.allocations < g.capacity
  );
  if (open.length === 0) return null;

  const pick = open[Math.floor(Math.random() * open.length)];
  return pick.id;
}
