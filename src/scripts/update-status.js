/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found');
    return;
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const updated = await prisma.greyInward.updateMany({
    where: {
      status: 'Open'
    },
    data: {
      status: 'In-Warehouse'
    }
  });
  console.log(`Updated ${updated.count} lots to 'In-Warehouse'`);
  await prisma.$disconnect();
}

main().catch(e => console.error(e));
