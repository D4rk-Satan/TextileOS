const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncStatuses() {
  const inwards = await prisma.greyInward.findMany();

  for (const inward of inwards) {
    if (inward.status !== 'In-Warehouse' && inward.status !== 'Open' && inward.status !== 'Started') {
        console.log(`Updating batches for lot ${inward.lotNo} to ${inward.status}`);
        await prisma.batch.updateMany({
            where: { greyInwardId: inward.id },
            data: { status: inward.status }
        });
    }
  }
}

syncStatuses()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
