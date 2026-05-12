/* eslint-disable @typescript-eslint/no-explicit-any */
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

export async function getNextDeliveryChallanNumber() {
  try {
    const orgId = await getOrgId();
    const count = await prisma.deliveryChallan.count({
      where: { organizationId: orgId }
    });
    return { success: true, data: `DC-${count + 1201}` }; // Delivery Challan series
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReadyForDispatchLots(customerId: string) {
  try {
    const orgId = await getOrgId();
    if (!customerId) return { success: true, data: [] };

    const batches = await prisma.batch.findMany({
      where: {
        status: 'Ready For Dispatch',
        greyInward: {
          organizationId: orgId,
          customerId: customerId
        }
      },
      include: {
        greyInward: true,
        printingReceive: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Group batches by Lot No
    const groupedLots: Record<string, any> = {};
    batches.forEach(batch => {
      const lotNo = batch.greyInward.lotNo;
      if (!groupedLots[lotNo]) {
        groupedLots[lotNo] = {
          lotNo: lotNo,
          quality: batch.greyInward.quality,
          processType: batch.greyInward.processType,
          batches: []
        };
      }
      groupedLots[lotNo].batches.push({
        id: batch.id,
        batchNo: batch.batchNo,
        mtrs: Number(batch.mtrs || 0),
        rfdMtrs: Number(batch.rfdMtrs || 0),
        printMtrs: Number(batch.printMtrs || 0)
      });
    });

    return { success: true, data: Object.values(groupedLots) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDeliveryChallan(data: any) {
  try {
    const orgId = await getOrgId();
    
    const challan = await prisma.deliveryChallan.create({
      data: {
        challanNo: data.challanNo,
        date: new Date(data.date),
        customerId: data.customerId,
        remark: data.remark,
        organizationId: orgId,
        batches: {
          connect: data.batchIds.map((id: string) => ({ id }))
        }
      }
    });

    await prisma.batch.updateMany({
      where: { id: { in: data.batchIds } },
      data: { status: 'Dispatched' }
    });

    revalidatePath('/dashboard/delivery-challan');
    revalidatePath('/dashboard/warehouse');
    return { success: true, data: challan };
  } catch (error: any) {
    console.error('Error creating delivery challan:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDeliveryChallan(id: string, data: any) {
  try {
    const orgId = await getOrgId();
    
    const challan = await prisma.deliveryChallan.update({
      where: { id, organizationId: orgId },
      data: {
        date: new Date(data.date),
        customerId: data.customerId,
        remark: data.remark,
      }
    });

    revalidatePath('/dashboard/delivery-challan');
    return { success: true, data: challan };
  } catch (error: any) {
    console.error('Error updating delivery challan:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDeliveryChallan(id: string) {
  try {
    const orgId = await getOrgId();
    
    const challan = await prisma.deliveryChallan.findUnique({
      where: { id, organizationId: orgId },
      include: { batches: true }
    });

    if (!challan) return { success: false, error: 'Challan not found' };

    // Revert batch status
    await prisma.batch.updateMany({
      where: { id: { in: challan.batches.map(b => b.id) } },
      data: { status: 'Ready For Dispatch' }
    });

    // Delete record
    await prisma.deliveryChallan.delete({
      where: { id, organizationId: orgId }
    });

    revalidatePath('/dashboard/delivery-challan');
    revalidatePath('/dashboard/warehouse');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting delivery challan:', error);
    return { success: false, error: error.message };
  }
}

export async function getDeliveryChallans(search?: string) {
  try {
    const orgId = await getOrgId();
    const challans = await prisma.deliveryChallan.findMany({
      where: { 
        organizationId: orgId,
        ...(search ? {
          OR: [
            { challanNo: { contains: search, mode: 'insensitive' } },
            { customer: { customerName: { contains: search, mode: 'insensitive' } } }
          ]
        } : {})
      },
      include: {
        customer: true,
        batches: {
          include: {
            greyInward: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedData = challans.map((challan: any) => {
      const lotNumbers = Array.from(new Set(challan.batches.map((b: any) => b.greyInward.lotNo)));
      return {
        ...challan,
        lotNumbers,
        totalMtrs: challan.batches.reduce((sum: number, b: any) => sum + Number(b.printMtrs || 0), 0)
      };
    });

    return { success: true, data: serializedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
