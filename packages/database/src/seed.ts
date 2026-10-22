import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Default free plan
  await prisma.subscriptionPlan.upsert({
    where: { name: 'Free' },
    update: {},
    create: {
      name: 'Free',
      maxBots: 2,
      maxConcurrentBots: 1,
      maxWorkerRamMb: 256,
      maxCpuPercent: 40,
      logRetentionDays: 3,
      analyticsRetentionDays: 7,
      schedulingEnabled: false,
      notificationsEnabled: true,
      isDefault: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      name: 'Starter',
      maxBots: 5,
      maxConcurrentBots: 3,
      maxWorkerRamMb: 512,
      maxCpuPercent: 60,
      logRetentionDays: 14,
      analyticsRetentionDays: 30,
      schedulingEnabled: true,
      notificationsEnabled: true,
      isDefault: false,
    },
  });

  // System settings
  const settings = [
    { key: 'site_name', value: 'MineAFK Cloud' },
    { key: 'site_description', value: 'Your Minecraft. Always Online.' },
    { key: 'maintenance_mode', value: false },
    { key: 'registration_enabled', value: true },
    { key: 'allowed_versions', value: ['1.20.1', '1.20.4', '1.21', '1.21.1'] },
    { key: 'max_bots_global', value: 50 },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

  console.log('Seed completed: Free + Starter plans and system settings created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
