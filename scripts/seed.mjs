import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !name || !password) {
    throw new Error(
      "Set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME, and BOOTSTRAP_ADMIN_PASSWORD in .env.local before running this script."
    );
  }
  if (password.length < 12) {
    const databaseUrl = process.env.DATABASE_URL;
    let databaseHost;
    try {
      databaseHost = new URL(databaseUrl).hostname;
    } catch {
      throw new Error("DATABASE_URL must be a valid URL.");
    }
    if (!["localhost", "127.0.0.1", "::1"].includes(databaseHost)) {
      throw new Error("Passwords shorter than 12 characters are allowed only with a local database.");
    }
  }

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    throw new Error(
      "The users table is not empty. Refusing to create or reset an account; use the admin user-management page instead."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name, passwordHash, role: "SUPERADMIN" },
  });
  console.log(`Initial Super Admin created for ${email}. Remove BOOTSTRAP_ADMIN_PASSWORD from .env.local after logging in.`);
}

main()
  .catch((error) => {
    console.error("Failed to create initial Super Admin:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
