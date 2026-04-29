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
        batches: true
      },
      orderBy: { createdAt: 'desc' },
    });
    const serializedData = inwards.map(inward => ({
      ...inward,
      totalMtr: Number(inward.totalMtr),
      batches: inward.batches.map(batch => ({
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

export async function createGreyOutward(data: any) {
  try {
    const orgId = await getOrgId();
    const greyOutward = await prisma.greyOutward.create({
      data: {
        date: new Date(data.date),
        lotNo: data.lotNo,
        dyeingHouseId: data.dyeingHouse,
        remark: data.remark,
        organizationId: orgId,
      },
    });

    // Optionally update the status of the GreyInward
    await prisma.greyInward.updateMany({
      where: { 
        lotNo: data.lotNo,
        organizationId: orgId
      },
      data: {
        status: 'Out For Dyeing'
      }
    });

    revalidatePath('/dashboard/dyeing-house');
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
        dyeingHouse: true
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: outwards };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createRFDInward(data: any) {
    try {
      const orgId = await getOrgId();
      const rfdInward = await prisma.rFDInward.create({
        data: {
          date: new Date(data.date),
          lotNo: data.lotNo,
          dyeingHouseId: data.dyeingHouse,
          remark: data.remark,
          organizationId: orgId,
        },
      });
  
      // Update status to RFD Inward
      await prisma.greyInward.updateMany({
        where: { 
          lotNo: data.lotNo,
          organizationId: orgId
        },
        data: {
          status: 'RFD Inward'
        }
      });
  
      revalidatePath('/dashboard/dyeing-house');
      return { success: true, data: rfdInward };
    } catch (error: any) {
      console.error('Error creating RFD inward:', error);
      return { success: false, error: error.message };
    }
  }

export async function getRFDInwards() {
    try {
      const orgId = await getOrgId();
      const inwards = await prisma.rFDInward.findMany({
        where: { organizationId: orgId },
        include: {
          dyeingHouse: true
        },
        orderBy: { createdAt: 'desc' },
      });
      return { success: true, data: inwards };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
