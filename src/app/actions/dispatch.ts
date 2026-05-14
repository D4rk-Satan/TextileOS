'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { withCache, invalidateCache } from '@/lib/redis';

export interface DispatchChallanData {
  challanNo: string;
  date: string | Date;
  customerId: string;
  remark?: string;
  batches: { id: string }[];
}

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
    return { success: false, error: error.message || 'Failed to fetch next DC number' };
  }
}

export async function getReadyForDispatchLots(customerId: string, page: number = 1, pageSize: number = 20) {
  try {
    const orgId = await getOrgId();
    if (!customerId) return { success: true, data: [], totalCount: 0, totalPages: 1, currentPage: page };

    const cacheKey = `dispatch:ready-lots:${orgId}:${customerId}:p${page}`;
    const where = {
      status: 'Ready For Dispatch' as const,
      greyInward: {
        organizationId: orgId,
        customerId: customerId
      }
    };

    const data = await withCache(cacheKey, async () => {
      const batches = await prisma.batch.findMany({
        where,
        include: {
          greyInward: true,
          printingReceive: true
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
            batches: [] as any[]
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
      return Object.values(groupedLots);
    });

    const totalCount = await prisma.batch.count({ where });

    return { 
      success: true, 
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch ready lots' };
  }
}

export async function createDeliveryChallan(data: DispatchChallanData) {
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
    await invalidateCache([`dispatch:ready-lots:${orgId}`, `dispatch:challans:${orgId}`, `batches:${orgId}`]);
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

export async function getDeliveryChallans(search?: string, filters: any = {}, page: number = 1, pageSize: number = 20) {
  try {
    const orgId = await getOrgId();
    const cacheKey = `dispatch:challans:${orgId}:${search || ''}:${JSON.stringify(filters)}:p${page}`;
    const where = {
      organizationId: orgId,
      ...(search ? {
        OR: [
          { challanNo: { contains: search, mode: 'insensitive' as const } },
          { customer: { customerName: { contains: search, mode: 'insensitive' as const } } }
        ]
      } : {}),
      ...(filters.entityId ? { customerId: filters.entityId } : {}),
      ...(filters.startDate && filters.endDate ? {
        date: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        }
      } : {}),
    };

    const data = await withCache(cacheKey, async () => {
      const challans = await prisma.deliveryChallan.findMany({
        where,
        include: {
          customer: true,
          batches: {
            include: {
              greyInward: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return challans.map(challan => ({
        ...challan,
        lotNumbers: Array.from(new Set(challan.batches.map((b: any) => b.greyInward.lotNo))),
        totalMtrs: challan.batches.reduce((sum: number, b: any) => sum + Number(b.printMtrs || 0), 0),
        batches: challan.batches.map(batch => ({
          ...batch,
          mtrs: Number(batch.mtrs || 0),
          rfdMtrs: Number(batch.rfdMtrs || 0),
          printMtrs: Number(batch.printMtrs || 0)
        }))
      }));
    });

    const totalCount = await prisma.deliveryChallan.count({ where });

    return { 
      success: true, 
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Bulk Import Action ---

export async function bulkCreateDeliveryChallans(data: any[]) {
  try {
    const orgId = await getOrgId();
    
    // 1. Fetch customers and inwards for mapping
    const [customers, inwards] = await Promise.all([
      prisma.customer.findMany({ where: { organizationId: orgId } }),
      prisma.greyInward.findMany({ 
        where: { organizationId: orgId },
        include: { batches: true }
      })
    ]);

    const results = await prisma.$transaction(
      data.map(row => {
        const lotNo = String(row.lotNo || row['Lot No'] || '');
        const customerName = row.customer || row['Customer'] || '';
        
        const customer = customers.find(c => c.customerName.toLowerCase() === customerName.toLowerCase());
        const inward = inwards.find(i => i.lotNo === lotNo);

        if (!inward || !customer) return null;

        return prisma.deliveryChallan.create({
          data: {
            date: new Date(row.date || row['Date'] || new Date()),
            challanNo: String(row.challanNo || row['Challan No'] || ''),
            customerId: customer.id,
            remark: row.remark || row['Remark'] || '',
            organizationId: orgId,
            batches: {
              connect: inward.batches.map(b => ({ id: b.id }))
            }
          }
        });
      }).filter(p => p !== null) as any
    );

    // Update batch statuses
    const lotNos = data.map(row => String(row.lotNo || row['Lot No'] || ''));
    await prisma.batch.updateMany({
      where: { 
        greyInward: { lotNo: { in: lotNos }, organizationId: orgId }
      },
      data: { status: 'Dispatched' }
    });

    revalidatePath('/dashboard/delivery-challan');
    revalidatePath('/dashboard/warehouse');
    return { success: true, count: results.length };
  } catch (error: any) {
    console.error('Bulk Dispatch Error:', error);
    return { success: false, error: error.message };
  }
}
