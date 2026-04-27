import "dotenv/config";
import { FieldType, FormType, PrismaClient, RoleName } from "@prisma/client";
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

  const existingContactForm = await prisma.formDefinition.findFirst({
    where: {
      formType: FormType.CONTACT,
      name: "Contact Form",
    },
  });

  if (!existingContactForm) {
    await prisma.formDefinition.create({
      data: {
        name: "Contact Form",
        formType: FormType.CONTACT,
        isActive: true,
        successMessage: "Thank you. Your message has been received.",
        fields: {
          create: [
            {
              name: "firstName",
              label: "First name",
              fieldType: FieldType.TEXT,
              isRequired: true,
              sortOrder: 0,
            },
            {
              name: "lastName",
              label: "Last name",
              fieldType: FieldType.TEXT,
              isRequired: true,
              sortOrder: 1,
            },
            {
              name: "email",
              label: "Email",
              fieldType: FieldType.EMAIL,
              isRequired: true,
              sortOrder: 2,
            },
            {
              name: "company",
              label: "Company",
              fieldType: FieldType.TEXT,
              isRequired: false,
              sortOrder: 3,
            },
            {
              name: "phone",
              label: "Phone",
              fieldType: FieldType.PHONE,
              isRequired: false,
              sortOrder: 4,
            },
            {
              name: "message",
              label: "Message",
              fieldType: FieldType.TEXTAREA,
              isRequired: true,
              sortOrder: 5,
            },
            {
              name: "consent",
              label: "I consent to being contacted about my request.",
              fieldType: FieldType.CHECKBOX,
              isRequired: true,
              sortOrder: 6,
            },
          ],
        },
      },
    });
  }

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
