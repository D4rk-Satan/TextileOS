import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    console.log('Testing connection...')
    const count = await prisma.user.count()
    console.log('Connection successful. User count:', count)
    
    console.log('Checking PrintingReceive table...')
    const pr = await prisma.printingReceive.findFirst()
    console.log('PrintingReceive record found:', pr)
    if (pr) {
      console.log('Production Number:', pr.productionNumber)
    }
    
  } catch (e) {
    console.error('Database error detected:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
