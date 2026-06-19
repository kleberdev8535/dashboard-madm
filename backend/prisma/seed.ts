import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const unidadeSP = await prisma.unidade.upsert({
    where: { nome: 'São Paulo' },
    update: {},
    create: { nome: 'São Paulo', cidade: 'São Paulo', estado: 'SP' },
  });

  const unidadeRP = await prisma.unidade.upsert({
    where: { nome: 'Ribeirão Preto' },
    update: {},
    create: { nome: 'Ribeirão Preto', cidade: 'Ribeirão Preto', estado: 'SP' },
  });

  const equipeComercial = await prisma.equipe.create({
    data: { nome: 'Comercial SP', tipo: 'COMERCIAL', unidadeId: unidadeSP.id },
  });

  const equipeBackoffice = await prisma.equipe.create({
    data: { nome: 'Backoffice', tipo: 'BACKOFFICE', unidadeId: unidadeSP.id },
  });

  const adminPassword = await bcrypt.hash('Admin@2024!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@corporateinsights.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@corporateinsights.com',
      password: adminPassword,
      role: Role.ADMIN,
      unidadeId: unidadeSP.id,
    },
  });

  const supervisorPassword = await bcrypt.hash('Super@2024!', 12);
  await prisma.user.upsert({
    where: { email: 'supervisor@corporateinsights.com' },
    update: {},
    create: {
      name: 'Supervisor Geral',
      email: 'supervisor@corporateinsights.com',
      password: supervisorPassword,
      role: Role.SUPERVISOR,
      equipeId: equipeComercial.id,
      unidadeId: unidadeSP.id,
    },
  });

  console.log('Seed concluído com sucesso!');
  console.log('Admin: admin@corporateinsights.com / Admin@2024!');
  console.log('Supervisor: supervisor@corporateinsights.com / Super@2024!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
