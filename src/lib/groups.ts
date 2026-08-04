import { prisma } from "@/lib/db";

/**
 * Picks the group (venue) with the fewest members for a cluster+phase,
 * choosing randomly among ties so multi-venue clusters stay balanced.
 * If no groups exist yet for the cluster+phase, creates one per venue.
 */
export async function assignGroup(clusterId: number, phaseId: number): Promise<number> {
  let groups = await prisma.group.findMany({
    where: { clusterId, phaseId },
    include: { _count: { select: { allocations: true } } },
  });

  if (groups.length === 0) {
    const venues = await prisma.venue.findMany({ where: { clusterId } });
    if (venues.length === 0) {
      const created = await prisma.group.create({
        data: { clusterId, phaseId, name: "Main Group" },
      });
      return created.id;
    }
    for (const v of venues) {
      await prisma.group.create({
        data: { clusterId, phaseId, venueId: v.id, name: v.name },
      });
    }
    groups = await prisma.group.findMany({
      where: { clusterId, phaseId },
      include: { _count: { select: { allocations: true } } },
    });
  }

  const min = Math.min(...groups.map((g) => g._count.allocations));
  const smallest = groups.filter((g) => g._count.allocations === min);
  const pick = smallest[Math.floor(Math.random() * smallest.length)];
  return pick.id;
}

/** Returns the group (and its venue) for a given phase allocation. */
export async function getGroupForAllocation(phaseAllocationId: number) {
  return prisma.phaseAllocation.findUnique({
    where: { id: phaseAllocationId },
    include: { group: { include: { venue: true } } },
  });
}

export async function countGroupMembers(groupId: number): Promise<number> {
  return prisma.phaseAllocation.count({ where: { groupId } });
}
