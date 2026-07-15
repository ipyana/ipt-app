import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { allocationSchema } from "@/lib/validations";
import { sendAllocationEmail } from "@/lib/email";

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

    const prefs = [application.clusterPref1, application.clusterPref2, application.clusterPref3];
    if (!prefs.includes(clusterId)) return err("Allocation must be one of the student's 3 preferences", 400);

    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId },
      include: { allowedPrograms: { include: { program: true } } },
    });
    if (!cluster) return err("Cluster not found", 404);

    const cp = cluster.allowedPrograms.find(
      (ap) => ap.program.name === application.student.program
    );
    if (!cp) return err(`Student's program not assigned to this cluster`, 400);
    if (cp.enrolled >= cp.slots) return err(`All ${cp.slots} slots for this program are full`, 409);

    await prisma.clusterProgram.update({
      where: { clusterId_programId: { clusterId, programId: cp.programId } },
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
      include: { allowedPrograms: { include: { program: true } } },
    });

    const cpMap = new Map<string, { clusterId: number; programId: number; slots: number; enrolled: number }>();
    for (const c of clusters) {
      for (const ap of c.allowedPrograms) {
        cpMap.set(`${c.id}:${ap.program.name}`, {
          clusterId: c.id,
          programId: ap.programId,
          slots: ap.slots,
          enrolled: ap.enrolled,
        });
      }
    }

    let allocated = 0;

    for (const app of pending) {
      const prefs = [app.clusterPref1, app.clusterPref2, app.clusterPref3];

      for (const clusterId of prefs) {
        const key = `${clusterId}:${app.student.program}`;
        const cp = cpMap.get(key);
        if (cp && cp.enrolled < cp.slots) {
          await prisma.clusterProgram.update({
            where: { clusterId_programId: { clusterId: cp.clusterId, programId: cp.programId } },
            data: { enrolled: { increment: 1 } },
          });

          await prisma.cluster.update({
            where: { id: cp.clusterId },
            data: { currentEnrolled: { increment: 1 } },
          });

          await prisma.application.update({
            where: { id: app.id },
            data: { allocatedCluster: cp.clusterId, status: "allocated" },
          });

          cp.enrolled++;

          const cluster = clusters.find((c) => c.id === cp.clusterId);
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
