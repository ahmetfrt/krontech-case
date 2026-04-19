import "dotenv/config";
import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: { name: RoleName.ADMIN },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: RoleName.EDITOR },
    update: {},
    create: { name: RoleName.EDITOR },
  });

  const hashedPassword = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@krontech.local" },
    update: {
      name: "System Admin",
      passwordHash: hashedPassword,
      roleId: adminRole.id,
    },
    create: {
      name: "System Admin",
      email: "admin@krontech.local",
      passwordHash: hashedPassword,
      roleId: adminRole.id,
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });