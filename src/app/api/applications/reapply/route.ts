import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { reapplySchema } from "@/lib/validations";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const application = await prisma.application.findUnique({
      where: { studentId: session.id },
    });
    if (!application || application.status !== "allocated") {
      return err("No active allocation", 400);
    }

    const hoursSince = (Date.now() - new Date(application.submissionDate).getTime()) / (1000 * 60 * 60);
    if (hoursSince > 72) {
      return err("You cannot apply for transfer/reallocation since the due time has passed", 403);
    }

    const body = await request.json();
    const parsed = reapplySchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0].message, 400);
    }

    const { type } = parsed.data;
    const currentClusters = [application.clusterPref1, application.clusterPref2];

    // A student who submits a reapplication/transfer has clearly activated their account.
    const me = await prisma.student.findUnique({ where: { id: session.id } });
    if (me && me.status !== "active") {
      await prisma.student.update({ where: { id: me.id }, data: { status: "active" } });
    }

    if (type === "reapplication") {
      const { pref1, pref2 } = parsed.data;
      if (!pref1 || !pref2 || pref1 === pref2) {
        return err("Select two distinct clusters for reapplication", 400);
      }
      if (currentClusters.includes(pref1) || currentClusters.includes(pref2)) {
        return err("New clusters must differ from your current allocation", 400);
      }

      const student = await prisma.student.findUnique({ where: { id: session.id } });
      if (!student) return err("Student not found", 404);

      const clusters = await prisma.cluster.findMany({
        where: { id: { in: [pref1, pref2] } },
        include: { allowedDepartments: { include: { department: true } } },
      });
      if (clusters.length !== 2) return err("One or more clusters do not exist", 400);

      for (const cluster of clusters) {
        const cd = cluster.allowedDepartments?.find(
          (ad) => ad.department?.abbreviation === student.department
        );
        if (!cd) {
          return err(`Your department has no slots in "${cluster.name}"`, 403);
        }
        if (cd.enrolled >= cd.slots) {
          return err(`No available slots in "${cluster.name}"`, 409);
        }
      }

      const pending = await prisma.transferRequest.findFirst({
        where: { applicationId: application.id, status: "pending" },
      });
      if (pending) return err("You already have a pending request", 409);

      await prisma.$transaction(async (tx) => {
        await tx.application.update({
          where: { id: application.id },
          data: { status: "reapplying" },
        });

        await tx.transferRequest.create({
          data: {
            applicationId: application.id,
            type: "reapplication",
            fromClusterId: application.clusterPref1,
            pref1New: pref1,
            pref2New: pref2,
            reason: body.reason || "Full reapplication",
            status: "pending",
          },
        });
      });

      return NextResponse.json({ success: true, message: "Reapplication submitted. Wait for review within 72 hours." }, { status: 201 });
    }

    if (type === "transfer") {
      const { toClusterId, pref1, pref2, reason } = parsed.data;
      if ((reason || "").trim().length < 10) {
        return err("Provide a reason (min 10 characters)", 400);
      }

      const student = await prisma.student.findUnique({ where: { id: session.id } });
      if (!student) return err("Student not found", 404);

      // Transfer can change one cluster (toClusterId) or both clusters (pref1+pref2)
      if (toClusterId) {
        if (currentClusters.includes(toClusterId)) {
          return err("You are already allocated to that cluster", 400);
        }
        const cd = await prisma.clusterDepartment.findFirst({
          where: { clusterId: toClusterId, department: { abbreviation: student.department } },
        });
        if (!cd) return err("Your department is not eligible for that cluster", 403);
        if (cd.enrolled >= cd.slots) return err("No available slots in that cluster", 409);
      } else if (pref1 && pref2) {
        if (pref1 === pref2) return err("Select two distinct clusters", 400);
        if (currentClusters.includes(pref1) || currentClusters.includes(pref2)) {
          return err("New clusters must differ from your current allocation", 400);
        }
        const clusters = await prisma.cluster.findMany({
          where: { id: { in: [pref1, pref2] } },
          include: { allowedDepartments: { include: { department: true } } },
        });
        for (const cluster of clusters) {
          const cd = cluster.allowedDepartments?.find((ad) => ad.department?.abbreviation === student.department);
          if (!cd) return err(`Your department is not eligible for "${cluster.name}"`, 403);
          if (cd.enrolled >= cd.slots) return err(`No available slots in "${cluster.name}"`, 409);
        }
      } else {
        return err("Select either one cluster to swap or two distinct clusters to change both", 400);
      }

      const pending = await prisma.transferRequest.findFirst({
        where: { applicationId: application.id, status: "pending" },
      });
      if (pending) return err("You already have a pending request", 409);

      await prisma.$transaction(async (tx) => {
        await tx.application.update({
          where: { id: application.id },
          data: { status: "reapplying" },
        });

        await tx.transferRequest.create({
          data: {
            applicationId: application.id,
            type: "transfer",
            fromClusterId: application.clusterPref1,
            toClusterId: toClusterId ?? null,
            pref1New: pref1 ?? null,
            pref2New: pref2 ?? null,
            reason: reason || "",
            status: "pending",
          },
        });
      });

      return NextResponse.json({ success: true, message: "Transfer submitted. Wait for review within 72 hours." }, { status: 201 });
    }

    return err("Invalid type. Use 'transfer' or 'reapplication'", 400);
  } catch (e: any) {
    if (e.message === "Unauthorized") return err("Unauthorized", 401);
    return err("Request failed", 500);
  }
}
