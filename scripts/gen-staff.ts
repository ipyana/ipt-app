import bcrypt from "bcryptjs";
import { CLUSTER_SEED_DATA } from "../src/lib/clusterData";

async function main() {
  const hash = await bcrypt.hash("Staff@123", 12);
  const lines: string[] = [];
  let i = 1;
  for (const cd of CLUSTER_SEED_DATA) {
    for (const s of cd.staff) {
      lines.push(`('${s.name.replace(/'/g, "''")}', '${s.email.replace(/'/g, "''")}', '${hash}', 'staff', true, false, 'active', NULL, ${i}, NOW())`);
    }
    i++;
  }
  console.log(lines.join(",\n"));
}
main();
