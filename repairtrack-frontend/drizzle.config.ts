import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;
const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? databaseUrl;

if (!migrationUrl) {
  throw new Error('DATABASE_URL is required in .env.local');
}

if (!process.env.MIGRATION_DATABASE_URL && databaseUrl?.includes('-pooler')) {
  throw new Error(
    'DATABASE_URL uses Neon pooler (-pooler). Set MIGRATION_DATABASE_URL to the direct Neon connection string before running db:generate or db:migrate. See docs/customer-approval-testing.md.',
  );
}

if (process.env.MIGRATION_DATABASE_URL?.includes('-pooler')) {
  throw new Error(
    'MIGRATION_DATABASE_URL must be Neon direct connection (no -pooler). See docs/customer-approval-testing.md.',
  );
}

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
  },
});
