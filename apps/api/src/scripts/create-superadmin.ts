/**
 * One-time Super Admin creation script.
 * Usage:
 *   SUPERADMIN_BOOTSTRAP_SECRET=your-secret npx tsx src/scripts/create-superadmin.ts --email=admin@example.com --password=StrongPass123!
 *
 * Never expose this publicly. Run only once during setup.
 */
import argon2 from 'argon2';
import { prisma, Role } from '@mineafk/database';

async function main() {
  const secret = process.env.SUPERADMIN_BOOTSTRAP_SECRET;
  if (!secret || secret.length < 16) {
    console.error('Set SUPERADMIN_BOOTSTRAP_SECRET (min 16 chars)');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith('--email='));
  const passArg = args.find((a) => a.startsWith('--password='));

  if (!emailArg || !passArg) {
    console.error('Usage: --email=... --password=...');
    process.exit(1);
  }

  const email = emailArg.split('=')[1];
  const password = passArg.split('=')[1];

  if (password.length < 12) {
    console.error('Password must be at least 12 characters');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error('User already exists');
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: 'Super Admin',
      role: Role.SUPER_ADMIN,
      emailVerified: true,
    },
  });

  console.log('Super Admin created:', user.id, user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
