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
  await prisma.clusterDepartment.deleteMany();
  await prisma.cluster.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admin.deleteMany();
  console.log("Existing data cleared.");

  const adminHashedPassword = await bcrypt.hash("Admin@123", 12);
  const superHashedPassword = await bcrypt.hash("SuperAdmin@123", 12);
  const staffHashedPassword = await bcrypt.hash("Staff@123", 12);

  await prisma.admin.create({
    data: { username: "superadmin", email: "superadmin@ipt.must.ac.tz", password: superHashedPassword, role: "super_admin" },
  });
  console.log('Super Admin created — username: superadmin / password: SuperAdmin@123');

  await prisma.admin.create({
    data: { username: "admin", email: "admin@ipt.must.ac.tz", password: adminHashedPassword, role: "admin" },
  });
  console.log("Admin created — username: admin / password: Admin@123");

  await prisma.admin.create({
    data: { username: "coordinator", email: "coordinator@ipt.must.ac.tz", password: adminHashedPassword, role: "coordinator" },
  });
  console.log("Coordinator created — username: coordinator / password: Admin@123");

  const adminUsers = [
    { username: "emmanuel.malissa", name: "Emmanuel Malissa", email: "Malissaemmanuel@gmail.com", phone: "+255782536312" },
    { username: "benard.joseph", name: "Benard Joseph", email: "benardjosephi18@gmail.com", phone: "+255676203734" },
    { username: "juma.ally", name: "Dr. Juma Ally", email: "jeiside@gmail.com", phone: "+255657903492" },
  ];
  for (const u of adminUsers) {
    await prisma.admin.create({
      data: { username: u.username, email: u.email, phone: u.phone, password: adminHashedPassword, role: "admin", mustChangePassword: true },
    });
    console.log(`Admin created — ${u.name} / ${u.email} / ${u.phone} / password: Admin@123 (must change)`);
  }

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

  const clusterVenueIds: Record<string, number[]> = {};
  for (const cd of CLUSTER_SEED_DATA) {
    const cluster = await prisma.cluster.create({
      data: {
        name: cd.name,
        description: cd.description,
        capacity: cd.capacity,
        location: cd.location,
      },
    });

    for (const [deptAbbr, slots] of Object.entries(cd.departmentSlots)) {
      const deptId = deptMap[deptAbbr];
      if (deptId && slots > 0) {
        await prisma.clusterDepartment.create({
          data: { clusterId: cluster.id, departmentId: deptId, slots },
        });
      }
    }

    const venueIds: number[] = [];
    for (const v of cd.venues) {
      const venue = await prisma.venue.create({
        data: { clusterId: cluster.id, name: v },
      });
      venueIds.push(venue.id);
    }
    clusterVenueIds[cluster.id] = venueIds;

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
    console.log(`Cluster "${cluster.name}" — ${Object.keys(cd.departmentSlots).length} departments, ${cd.staff.length} staff, ${cd.venues.length} venues`);
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
    const p1 = await prisma.phase.create({
      data: { sessionId: session.id, phaseNumber: 1, clusterId: cluster.id, startDate: p1Start, endDate: p1End },
    });
    const p2 = await prisma.phase.create({
      data: { sessionId: session.id, phaseNumber: 2, clusterId: cluster.id, startDate: p2Start, endDate: p2End },
    });

    for (const venueId of clusterVenueIds[cluster.id] || []) {
      const venue = await prisma.venue.findUnique({ where: { id: venueId } });
      await prisma.group.create({
        data: { clusterId: cluster.id, phaseId: p1.id, venueId, name: venue?.name || `Group ${venueId}` },
      });
      await prisma.group.create({
        data: { clusterId: cluster.id, phaseId: p2.id, venueId, name: venue?.name || `Group ${venueId}` },
      });
    }
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
