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

  const existingAdmin = await prisma.admin.findFirst({ where: { username: "admin" } });
  if (existingAdmin) {
    console.log("Data already seeded — skipping.");
    return;
  }

  console.log("Clearing existing data...");

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

  await prisma.admin.create({
    data: { username: "admin", email: "admin@ipt.university.ac.ke", password: adminHashedPassword, role: "admin" },
  });
  console.log("Admin created — username: admin / password: Admin@123");

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
      await prisma.staff.create({ data: { name: s.name, email: s.email, clusterId: cluster.id } });
    }
    console.log(`Cluster "${cluster.name}" — ${Object.keys(cd.programSlots).length} programs, ${cd.staff.length} staff`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
