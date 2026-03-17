import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("dl4aib2024", 10);
  await prisma.user.upsert({
    where: { email: "admin@dl4aib.org" },
    update: { passwordHash: hash, role: "SUPERADMIN" },
    create: {
      email: "admin@dl4aib.org",
      name: "Super Admin",
      passwordHash: hash,
      role: "SUPERADMIN",
    },
  });
  console.log("SuperAdmin seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
