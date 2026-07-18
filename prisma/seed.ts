import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { CLUSTER_SEED_DATA, DEPARTMENTS, PROGRAMS_BY_DEPT } from "../src/lib/clusterData";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const existingSuper = await prisma.admin.findFirst({ where: { username: "superadmin" } });
  if (existingSuper) {
    console.log("Data already seeded — skipping.");
    return;
  }

  console.log("Clearing existing data...");

  await prisma.waitlistEntry.deleteMany();
  await prisma.phaseAllocation.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.iptSession.deleteMany();
  await prisma.application.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.clusterProgram.deleteMany();
  await prisma.cluster.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admin.deleteMany();
  console.log("Existing data cleared.");

  const studentHashedPassword = await bcrypt.hash("Student@123", 12);
  const adminHashedPassword = await bcrypt.hash("Admin@123", 12);
  const superHashedPassword = await bcrypt.hash("SuperAdmin@123", 12);
  const staffHashedPassword = await bcrypt.hash("Staff@123", 12);

  await prisma.admin.create({
    data: { username: "superadmin", email: "superadmin@ipt.university.ac.ke", password: superHashedPassword, role: "super_admin" },
  });
  console.log('Super Admin created — username: superadmin / password: SuperAdmin@123');

  await prisma.admin.create({
    data: { username: "admin", email: "admin@ipt.university.ac.ke", password: adminHashedPassword, role: "admin" },
  });
  console.log("Admin created — username: admin / password: Admin@123");

  await prisma.admin.create({
    data: { username: "coordinator", email: "coordinator@ipt.university.ac.ke", password: adminHashedPassword, role: "coordinator" },
  });
  console.log("Coordinator created — username: coordinator / password: Admin@123");

  const deptMap: Record<string, number> = {};
  for (const dept of DEPARTMENTS) {
    const d = await prisma.department.create({ data: { name: dept.name, abbreviation: dept.abbreviation } });
    deptMap[d.abbreviation] = d.id;
    console.log(`Department: ${d.name} (${d.abbreviation})`);
  }

  const programMap: Record<string, number> = {};
  for (const [abbrev, names] of Object.entries(PROGRAMS_BY_DEPT)) {
    for (const name of names) {
      const p = await prisma.program.create({ data: { name, departmentId: deptMap[abbrev] } });
      programMap[name] = p.id;
      console.log(`  Program: ${name} (${abbrev})`);
    }
  }

  for (let i = 1; i <= 30; i++) {
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const progs = PROGRAMS_BY_DEPT[dept.abbreviation];
    const prog = progs[i % progs.length];
    const paddedId = `2025${String(i).padStart(4, "0")}`;

    await prisma.student.create({
      data: {
        studentId: paddedId,
        fullName: `Student ${i} (${dept.abbreviation})`,
        department: dept.abbreviation,
        program: prog,
        email: `student${i}@university.ac.ke`,
        password: studentHashedPassword,
        role: "student",
      },
    });
  }
  console.log("30 sample students created — reg: 20250001–20250030 / password: Student@123");

  for (const cd of CLUSTER_SEED_DATA) {
    const cluster = await prisma.cluster.create({
      data: {
        name: cd.name,
        description: cd.description,
        capacity: cd.capacity,
        location: cd.location,
      },
    });

    for (const [progName, slots] of Object.entries(cd.programSlots)) {
      const pid = programMap[progName];
      if (pid) {
        await prisma.clusterProgram.create({
          data: { clusterId: cluster.id, programId: pid, slots },
        });
      }
    }

    for (const s of cd.staff) {
      await prisma.staff.create({
        data: {
          name: s.name,
          email: s.email,
          password: staffHashedPassword,
          role: "staff",
          clusterId: cluster.id,
        },
      });
    }
    console.log(`Cluster "${cluster.name}" — ${Object.keys(cd.programSlots).length} programs, ${cd.staff.length} staff`);
  }
  console.log("Staff accounts created — password: Staff@123 for all staff emails");

  const session = await prisma.iptSession.create({
    data: {
      name: "IPT 2025/2026",
      startDate: new Date("2026-08-10"),
      endDate: new Date("2026-10-16"),
      weeksPerPhase: 5,
      isActive: true,
    },
  });
  console.log(`IPT Session created: ${session.name} (${session.startDate.toDateString()} – ${session.endDate.toDateString()})`);

  const clusters = await prisma.cluster.findMany();
  const p1Start = new Date("2026-08-10");
  const p1End = new Date("2026-09-13");
  const p2Start = new Date("2026-09-14");
  const p2End = new Date("2026-10-16");

  for (const cluster of clusters) {
    await prisma.phase.create({
      data: { sessionId: session.id, phaseNumber: 1, clusterId: cluster.id, startDate: p1Start, endDate: p1End },
    });
    await prisma.phase.create({
      data: { sessionId: session.id, phaseNumber: 2, clusterId: cluster.id, startDate: p2Start, endDate: p2End },
    });
  }
  console.log(`Phases created: Phase 1 (${p1Start.toDateString()} – ${p1End.toDateString()}), Phase 2 (${p2Start.toDateString()} – ${p2End.toDateString()}) for ${clusters.length} clusters`);

  console.log("Seeding email templates...");
  const { syncDefaultTemplates, syncDefaultSettings } = await import("../src/lib/email/templates");
  await syncDefaultTemplates();
  await syncDefaultSettings();
  console.log("Email templates and settings seeded.");

  console.log("Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
