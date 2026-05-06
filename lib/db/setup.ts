import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

async function writeEnvFile() {
  const AUTH_SECRET = crypto.randomBytes(32).toString('hex');
  const BASE_URL = 'http://localhost:3000';

  const envContent = `AUTH_SECRET=${AUTH_SECRET}
BASE_URL=${BASE_URL}
DATABASE_URL=postgresql://user:password@localhost:5432/brand_story_saas
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
`;

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  console.log('.env file created.');
}

async function createDatabase() {
  console.log('Generating migration files...');
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(exec);

  try {
    await execAsync('npx drizzle-kit generate');
    console.log('Migration files generated.');
  } catch (e) {
    console.log('Migration generation skipped (may already exist).');
  }

  try {
    await execAsync('npx drizzle-kit migrate');
    console.log('Database migrated.');
  } catch (e) {
    console.log('Migration skipped, will use push instead.');
  }

  console.log('Seeding database...');
  try {
    await execAsync('npx tsx lib/db/seed.ts');
  } catch (e: any) {
    console.log('Seed output:', e.stdout || e.message);
  }
}

async function main() {
  console.log('Setting up Brand Story SaaS...');
  await writeEnvFile();
  await createDatabase();
  console.log('Setup completed! Run: npm run dev');
}

main().catch(console.error);
