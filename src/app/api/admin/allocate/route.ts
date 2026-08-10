import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { allocationSchema } from "@/lib/validations";
import { sendAllocationEmail } from "@/lib/email";
import { assignGroup } from "@/lib/groups";
import { reservePhaseSlot, releasePhaseSlot, getStudentDepartmentSlot } from "@/lib/allocate";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = allocationSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 400);

    const { applicationId, clusterId } = parsed.data;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { student: true, allocations: true },
    });
    if (!application) return err("Application not found", 404);
    if (application.status === "reapplying" || application.status === "waitlisted") {
      return err("Cannot reallocate while a reapplication/transfer or waitlist is pending", 400);
    }

    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId },
      include: { allowedDepartments: { include: { department: true } } },
    });
    if (!cluster) return err("Cluster not found", 404);

    const cd = cluster.allowedDepartments.find(
      (ad) => ad.department.abbreviation === application.student.department
    );
    if (!cd) return err(`Student's department not assigned to this cluster`, 400);
    if (cd.enrolled >= cd.slots || cd.phase2Enrolled >= cd.slots) return err(`All ${cd.slots} slots for ${application.student.department} are full`, 409);

    // If already allocated elsewhere, release the old slot + old allocations first (reallocation)
    if (application.allocatedCluster && application.allocatedCluster !== clusterId) {
      const oldCd = await prisma.clusterDepartment.findFirst({
        where: { clusterId: application.allocatedCluster, department: { abbreviation: application.student.department } },
      });
      if (oldCd) {
        await releasePhaseSlot(prisma, application.allocatedCluster, oldCd.departmentId, 1);
        await releasePhaseSlot(prisma, application.allocatedCluster, oldCd.departmentId, 2);
      }
      await prisma.phaseAllocation.deleteMany({ where: { applicationId } });
    }

    await reservePhaseSlot(prisma, clusterId, cd.departmentId, 1);
    await reservePhaseSlot(prisma, clusterId, cd.departmentId, 2);

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { allocatedCluster: clusterId, status: "allocated" },
      include: { student: true },
    });

    const phases = await prisma.phase.findMany({
      where: { session: { isActive: true }, clusterId },
      orderBy: { phaseNumber: "asc" },
    });
    for (const ph of phases) {
      const gid = await assignGroup(clusterId, ph.id);
      await prisma.phaseAllocation.create({
        data: { phaseId: ph.id, applicationId, clusterId, groupId: gid },
      });
    }

    await sendAllocationEmail({
      studentName: application.student.fullName,
      studentEmail: application.student.email,
      clusterName: cluster.name,
      clusterLocation: cluster.location,
      studentId: application.student.studentId,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Allocation failed", 500);
  }
}

export async function PUT() {
  try {
    await requireAdmin();

    const pending = await prisma.application.findMany({
      where: { status: "pending" },
      include: { student: true },
      orderBy: { submissionDate: "asc" },
    });

    const clusters = await prisma.cluster.findMany({
      include: { allowedDepartments: { include: { department: true } } },
    });

    const slotMap = new Map<string, { clusterId: number; departmentId: number; slots: number; enrolled: number; phase2Enrolled: number }>();
    for (const c of clusters) {
      for (const ad of c.allowedDepartments) {
        slotMap.set(`${c.id}:${ad.department.abbreviation}`, {
          clusterId: c.id,
          departmentId: ad.departmentId,
          slots: ad.slots,
          enrolled: ad.enrolled,
          phase2Enrolled: ad.phase2Enrolled,
        });
      }
    }

    let allocated = 0;

    for (const app of pending) {
      const prefs = [app.clusterPref1, app.clusterPref2];

      for (const clusterId of prefs) {
        const key = `${clusterId}:${app.student.department}`;
        const sd = slotMap.get(key);
        if (sd && sd.enrolled < sd.slots && sd.phase2Enrolled < sd.slots) {
          await reservePhaseSlot(prisma, sd.clusterId, sd.departmentId, 1);
          await reservePhaseSlot(prisma, sd.clusterId, sd.departmentId, 2);

          await prisma.application.update({
            where: { id: app.id },
            data: { allocatedCluster: sd.clusterId, status: "allocated" },
          });

          sd.enrolled++;
          sd.phase2Enrolled++;

          const phases = await prisma.phase.findMany({
            where: { session: { isActive: true }, clusterId: sd.clusterId },
            orderBy: { phaseNumber: "asc" },
          });
          for (const ph of phases) {
            const gid = await assignGroup(sd.clusterId, ph.id);
            await prisma.phaseAllocation.create({
              data: { phaseId: ph.id, applicationId: app.id, clusterId: sd.clusterId, groupId: gid },
            });
          }

          const cluster = clusters.find((c) => c.id === sd.clusterId);
          await sendAllocationEmail({
            studentName: app.student.fullName,
            studentEmail: app.student.email,
            clusterName: cluster?.name || "Unknown",
            clusterLocation: cluster?.location || "",
            studentId: app.student.studentId,
          });

          allocated++;
          break;
        }
      }
    }

    return NextResponse.json({ message: "Auto-allocation complete", allocated });
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    if (e.message === "Forbidden") return err("Forbidden", 403);
    return err("Auto-allocation failed", 500);
  }
}
