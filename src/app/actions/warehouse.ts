'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function getOrgId() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('org_id')?.value;
  if (!orgId) throw new Error('Unauthorized: No organization ID found');
  return orgId;
}

export async function getNextLotNumber() {
  try {
    const orgId = await getOrgId();
    const lastEntry = await prisma.greyInward.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      select: { lotNo: true }
    });

    if (!lastEntry) return { success: true, data: 1 };
    
    // Extract number from lotNo if it's formatted like "L-1" or just "1"
    const currentNo = parseInt(lastEntry.lotNo.replace(/[^0-9]/g, '')) || 0;
    return { success: true, data: currentNo + 1 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createGreyInward(data: any) {
  try {
    const orgId = await getOrgId();
    const greyInward = await prisma.greyInward.create({
      data: {
        lotNo: data.lotNo,
        date: new Date(data.date),
        challanNo: data.challanNo,
        quality: data.quality,
        processType: data.processType,
        batchDetail: data.batchDetail,
        status: data.status,
        image: data.image,
        totalBatch: parseInt(data.totalBatch) || 0,
        totalMtr: parseFloat(data.totalMtr) || 0,
        customerId: data.customer, // Expecting ID from dropdown
        organizationId: orgId,
        batches: {
          create: data.batches.map((batch: any) => ({
            batchNo: batch.batchNo,
            pcs: parseInt(batch.pcs) || 0,
            mtrs: parseFloat(batch.mtrs) || 0,
            weight: parseFloat(batch.weight) || 0,
          })),
        },
      },
      include: {
        batches: true,
      },
    });
    revalidatePath('/dashboard/warehouse');
    return { 
      success: true, 
      data: {
        ...greyInward,
        totalMtr: Number(greyInward.totalMtr),
        batches: greyInward.batches.map(batch => ({
          ...batch,
          mtrs: batch.mtrs ? Number(batch.mtrs) : 0,
          weight: batch.weight ? Number(batch.weight) : 0,
        }))
      } 
    };
  } catch (error: any) {
    console.error('Error creating grey inward:', error);
    return { success: false, error: error.message };
  }
}

export async function getGreyInwards() {
  try {
    const orgId = await getOrgId();
    const greyInwards = await prisma.greyInward.findMany({
      where: { organizationId: orgId },
      include: {
        customer: true,
        batches: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const serializedData = greyInwards.map(inward => ({
      ...inward,
      totalMtr: Number(inward.totalMtr),
      batches: inward.batches.map(batch => ({
        ...batch,
        mtrs: batch.mtrs ? Number(batch.mtrs) : 0,
        weight: batch.weight ? Number(batch.weight) : 0,
      }))
    }));
    return { success: true, data: serializedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBatches() {
  try {
    const orgId = await getOrgId();
    const batches = await prisma.batch.findMany({
      where: { 
        greyInward: {
          organizationId: orgId
        }
      },
      include: {
        greyInward: {
          include: {
            customer: true
          }
        }
      },
      orderBy: { id: 'desc' },
    });

    const serializedBatches = batches.map(batch => ({
      ...batch,
      mtrs: batch.mtrs ? Number(batch.mtrs) : 0,
      weight: batch.weight ? Number(batch.weight) : 0,
      greyInward: {
        ...batch.greyInward,
        totalMtr: Number(batch.greyInward.totalMtr)
      }
    }));

    return { success: true, data: serializedBatches };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
