'use server';

import prisma from '@/lib/prisma';
import { Batch } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

interface BatchInput {
  id: string;
}

interface DyeingActionData {
  date: string | Date;
  lotNo: string;
  dyeingHouse: string;
  remark?: string;
  batches: BatchInput[];
}

async function getOrgId() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('org_id')?.value;
  if (!orgId) throw new Error('Unauthorized: No organization ID found');
  return orgId;
}

export async function getDyeingHouses() {
  try {
    const orgId = await getOrgId();
    const vendors = await prisma.vendor.findMany({
      where: { 
        organizationId: orgId,
        status: 'Active'
      },
      orderBy: { vendorName: 'asc' },
    });
    return { success: true, data: vendors };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextDCNumber() {
  try {
    const orgId = await getOrgId();
    const count = await prisma.greyOutward.count({
      where: { organizationId: orgId }
    });
    return { success: true, data: `DC-${count + 1}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getGreyInwardsForOutward() {
  try {
    const orgId = await getOrgId();
    const inwards = await prisma.greyInward.findMany({
      where: { 
        organizationId: orgId,
        status: { in: ['In-Warehouse', 'Open', 'Started'] }
      },
      include: {
        batches: {
          where: { status: 'In-Warehouse' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    const serializedData = inwards.map(inward => ({
      ...inward,
      totalMtr: Number(inward.totalMtr),
      batches: (inward.batches as any[]).map((batch: any) => ({
        ...batch,
        mtrs: Number(batch.mtrs),
        weight: Number(batch.weight)
      }))
    }));
    return { success: true, data: serializedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createGreyOutward(data: DyeingActionData) {
  try {
    const orgId = await getOrgId();
    
    // 1. Create the GreyOutward record and connect selected batches
    const greyOutward = await prisma.greyOutward.create({
      data: {
        date: new Date(data.date),
        lotNo: data.lotNo,
        dyeingHouseId: data.dyeingHouse,
        remark: data.remark,
        organizationId: orgId,
        batches: {
          connect: data.batches.map((b) => ({ id: b.id }))
        }
      },
    });

    // 2. Update the status of specific batches to 'Out For Dyeing'
    await prisma.batch.updateMany({
      where: { 
        id: { in: data.batches.map((b) => b.id) }
      },
      data: {
        status: 'Out For RFD'
      }
    });

    // 3. Update the parent GreyInward status based on ALL its batches
    const inward = await prisma.greyInward.findFirst({
      where: { 
        lotNo: data.lotNo,
        organizationId: orgId
      },
      include: { batches: true }
    });

    if (inward) {
      const allBatches = inward.batches as Batch[];
      const allOut = allBatches.every(b => b.status === 'Out For RFD' || b.status === 'RFD Inward');
      const someOut = allBatches.some(b => b.status === 'Out For RFD' || b.status === 'RFD Inward');
      
      await prisma.greyInward.update({
        where: { id: inward.id },
        data: {
          status: allOut ? 'Out For RFD' : someOut ? 'Started' : 'In-Warehouse'
        }
      });
    }

    revalidatePath('/dashboard/dyeing-house');
    revalidatePath('/dashboard/warehouse');
    return { success: true, data: greyOutward };
  } catch (error: any) {
    console.error('Error creating grey outward:', error);
    return { success: false, error: error.message };
  }
}

export async function getGreyOutwards() {
  try {
    const orgId = await getOrgId();
    const outwards = await prisma.greyOutward.findMany({
      where: { organizationId: orgId },
      include: {
        dyeingHouse: true,
        batches: true
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all batches for these lots to show remaining ones
    const lotNos = Array.from(new Set(outwards.map(o => o.lotNo)));
    const inwards = await prisma.greyInward.findMany({
      where: {
        lotNo: { in: lotNos },
        organizationId: orgId
      },
      include: { batches: true }
    });

    const serializedData = outwards.map(outward => {
      const lotInward = inwards.find(i => i.lotNo === outward.lotNo);
      return {
        ...outward,
        allLotBatches: (lotInward?.batches || []).map(batch => ({
          ...batch,
          mtrs: Number(batch.mtrs),
          weight: Number(batch.weight)
        })),
        batches: outward.batches.map(batch => ({
          ...batch,
          mtrs: Number(batch.mtrs),
          weight: Number(batch.weight)
        }))
      };
    });
    return { success: true, data: serializedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createRFDInward(data: DyeingActionData) {
    try {
      const orgId = await getOrgId();
      
      // 1. Create the RFDInward record and connect selected batches
      const rfdInward = await prisma.rFDInward.create({
        data: {
          date: new Date(data.date),
          lotNo: data.lotNo,
          dyeingHouseId: data.dyeingHouse,
          remark: data.remark,
          organizationId: orgId,
          batches: {
            connect: data.batches.map((b) => ({ id: b.id }))
          }
        },
      });

      // 2. Update the status of specific batches to 'RFD Inward'
      await prisma.batch.updateMany({
        where: { 
          id: { in: data.batches.map((b) => b.id) }
        },
        data: {
          status: 'RFD Inward'
        }
      });

      // 3. Update parent GreyInward status
      const inward = await prisma.greyInward.findFirst({
        where: { 
          lotNo: data.lotNo,
          organizationId: orgId
        },
        include: { batches: true }
      });

      if (inward) {
        const allBatches = inward.batches as Batch[];
        const allRFD = allBatches.every(b => b.status === 'RFD Inward');
        await prisma.greyInward.update({
          where: { id: inward.id },
          data: {
            status: allRFD ? 'RFD Inward' : 'Out For RFD' // If not all back, it's still partially out
          }
        });
      }
  
      revalidatePath('/dashboard/dyeing-house');
      revalidatePath('/dashboard/warehouse');
      return { success: true, data: rfdInward };
    } catch (error: any) {
      console.error('Error creating RFD inward:', error);
      return { success: false, error: error.message };
    }
  }

export async function getRFDInwards() {
    try {
      const orgId = await getOrgId();
    const outwards = await prisma.rFDInward.findMany({
      where: { organizationId: orgId },
      include: {
        dyeingHouse: true,
        batches: true
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all batches for these lots
    const lotNos = Array.from(new Set(outwards.map(o => o.lotNo)));
    const inwards = await prisma.greyInward.findMany({
      where: {
        lotNo: { in: lotNos },
        organizationId: orgId
      },
      include: { batches: true }
    });

    const serializedData = outwards.map(outward => {
      const lotInward = inwards.find(i => i.lotNo === outward.lotNo);
      return {
        ...outward,
        allLotBatches: (lotInward?.batches || []).map(batch => ({
          ...batch,
          mtrs: Number(batch.mtrs),
          weight: Number(batch.weight)
        })),
        batches: outward.batches.map(batch => ({
          ...batch,
          mtrs: Number(batch.mtrs),
          weight: Number(batch.weight)
        }))
      };
    });
    return { success: true, data: serializedData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
