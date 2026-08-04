import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { allocationSchema } from "@/lib/validations";
import { sendAllocationEmail } from "@/lib/email";
import { assignGroup } from "@/lib/groups";

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
      include: { student: true },
    });
    if (!application) return err("Application not found", 404);
    if (application.status === "allocated") return err("Already allocated", 409);

    const prefs = [application.clusterPref1, application.clusterPref2];
    if (!prefs.includes(clusterId)) return err("Allocation must be one of the student's 2 preferences", 400);

    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId },
      include: { allowedDepartments: { include: { department: true } } },
    });
    if (!cluster) return err("Cluster not found", 404);

    const cd = cluster.allowedDepartments.find(
      (ad) => ad.department.abbreviation === application.student.department
    );
    if (!cd) return err(`Student's department not assigned to this cluster`, 400);
    if (cd.enrolled >= cd.slots) return err(`All ${cd.slots} slots for ${application.student.department} are full`, 409);

    await prisma.clusterDepartment.update({
      where: { clusterId_departmentId: { clusterId, departmentId: cd.departmentId } },
      data: { enrolled: { increment: 1 } },
    });

    await prisma.cluster.update({
      where: { id: clusterId },
      data: { currentEnrolled: { increment: 1 } },
    });

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

    const slotMap = new Map<string, { clusterId: number; departmentId: number; slots: number; enrolled: number }>();
    for (const c of clusters) {
      for (const ad of c.allowedDepartments) {
        slotMap.set(`${c.id}:${ad.department.abbreviation}`, {
          clusterId: c.id,
          departmentId: ad.departmentId,
          slots: ad.slots,
          enrolled: ad.enrolled,
        });
      }
    }

    let allocated = 0;

    for (const app of pending) {
      const prefs = [app.clusterPref1, app.clusterPref2];

      for (const clusterId of prefs) {
        const key = `${clusterId}:${app.student.department}`;
        const sd = slotMap.get(key);
        if (sd && sd.enrolled < sd.slots) {
          await prisma.clusterDepartment.update({
            where: { clusterId_departmentId: { clusterId: sd.clusterId, departmentId: sd.departmentId } },
            data: { enrolled: { increment: 1 } },
          });

          await prisma.cluster.update({
            where: { id: sd.clusterId },
            data: { currentEnrolled: { increment: 1 } },
          });

          await prisma.application.update({
            where: { id: app.id },
            data: { allocatedCluster: sd.clusterId, status: "allocated" },
          });

          sd.enrolled++;

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
