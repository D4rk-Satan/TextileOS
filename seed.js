require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🚀 Starting Super Admin creation...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const password = await bcrypt.hash('Admin@123', 10);

    const user = await prisma.user.upsert({
      where: { email: 'super@textileos.com' },
      update: {
        role: 'SuperAdmin'
      },
      create: {
        email: 'super@textileos.com',
        password: password,
        role: 'SuperAdmin',
      },
    });

    console.log('✅ Success! Super Admin account is ready.');
    console.log('📧 Email: super@textileos.com');
    console.log('🔑 Password: Admin@123');
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

seed();
