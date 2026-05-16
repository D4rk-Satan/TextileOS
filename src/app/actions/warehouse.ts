/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { withCache, invalidateCache } from '@/lib/redis';

async function getOrgId() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('org_id')?.value;
  if (!orgId) throw new Error('Unauthorized: No organization ID found');
  return orgId;
}

interface BatchData {
  batchNo: string;
  pcs: number;
  mtrs: number;
  weight: number;
}

interface GreyInwardData {
  lotNo: string;
  date: string | Date;
  challanNo: string;
  quality: string;
  processType: string;
  batchDetail?: string;
  status: string;
  image?: string;
  totalBatch: string | number;
  totalMtr: string | number;
  customer: string;
  batches: BatchData[];
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

export async function createGreyInward(data: GreyInwardData) {
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
        totalBatch: typeof data.totalBatch === 'string' ? parseInt(data.totalBatch) : data.totalBatch,
        totalMtr: typeof data.totalMtr === 'string' ? parseFloat(data.totalMtr) : data.totalMtr,
        customerId: data.customer, // Expecting ID from dropdown
        organizationId: orgId,
        batches: {
          create: data.batches.map((batch: BatchData) => ({
            batchNo: batch.batchNo,
            pcs: batch.pcs,
            mtrs: batch.mtrs,
            weight: batch.weight,
          })),
        },
      },
      include: {
        batches: true,
      },
    });
    revalidatePath('/dashboard/warehouse');
    await invalidateCache([`inwards:${orgId}`, `batches:${orgId}`]);
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

export async function updateGreyInward(id: string, data: GreyInwardData) {
  try {
    const orgId = await getOrgId();
    const greyInward = await prisma.greyInward.update({
      where: { id, organizationId: orgId },
      data: {
        lotNo: data.lotNo,
        date: new Date(data.date),
        challanNo: data.challanNo,
        quality: data.quality,
        processType: data.processType,
        batchDetail: data.batchDetail,
        status: data.status,
        image: data.image,
        totalBatch: typeof data.totalBatch === 'string' ? parseInt(data.totalBatch) : data.totalBatch,
        totalMtr: typeof data.totalMtr === 'string' ? parseFloat(data.totalMtr) : data.totalMtr,
        customerId: data.customer,
      },
    });
    revalidatePath('/dashboard/warehouse');
    await invalidateCache([`inwards:${orgId}`, `batches:${orgId}`]);
    
    // Serialization Fix: Convert Decimal to Number
    return { 
      success: true, 
      data: {
        ...greyInward,
        totalMtr: Number(greyInward.totalMtr)
      } 
    };
  } catch (error: any) {
    console.error('Error updating grey inward:', error);
    return { success: false, error: error.message };
  }
}

export async function getGreyInwards(search?: string, filters: { status?: string; entityId?: string; quality?: string; startDate?: string; endDate?: string } = {}, page: number = 1, pageSize: number = 20) {
  try {
    const orgId = await getOrgId();
    const where = { 
      organizationId: orgId,
      ...(search ? {
        OR: [
          { lotNo: { contains: search, mode: 'insensitive' as const } },
          { challanNo: { contains: search, mode: 'insensitive' as const } },
          { customer: { customerName: { contains: search, mode: 'insensitive' as const } } },
          { quality: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.entityId ? { customerId: filters.entityId } : {}),
      ...(filters.quality ? { quality: filters.quality } : {}),
      ...(filters.startDate && filters.endDate ? {
        date: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        }
      } : {}),
    };

    const cacheKey = `inwards:${orgId}:${search || ''}:${JSON.stringify(filters)}:p${page}`;

    const { data, totalCount } = await withCache(cacheKey, async () => {
      const [greyInwards, count] = await Promise.all([
        prisma.greyInward.findMany({
          where,
          include: {
            customer: true,
            batches: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.greyInward.count({ where })
      ]);

      const formattedData = greyInwards.map(inward => ({
        ...inward,
        totalMtr: Number(inward.totalMtr),
        batches: inward.batches.map(batch => ({
          ...batch,
          mtrs: batch.mtrs ? Number(batch.mtrs) : 0,
          weight: batch.weight ? Number(batch.weight) : 0,
        }))
      }));

      return { data: formattedData, totalCount: count };
    });

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

/** Fetches batches filtered by status and search */
export async function getBatches(status?: string, search?: string, filters: { entityId?: string; quality?: string; startDate?: string; endDate?: string; status?: string } = {}, page: number = 1, pageSize: number = 20) {
  try {
    const orgId = await getOrgId();
    const where = { 
      greyInward: {
        organizationId: orgId,
        ...(search ? {
          OR: [
            { lotNo: { contains: search, mode: 'insensitive' as const } },
            { customer: { customerName: { contains: search, mode: 'insensitive' as const } } },
            { quality: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {}),
        ...(filters.entityId ? { customerId: filters.entityId } : {}),
        ...(filters.quality ? { quality: filters.quality } : {}),
        ...(filters.startDate && filters.endDate ? {
          date: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          }
        } : {}),
      },
      ...(status ? { status } : (filters.status ? { status: filters.status } : {})),
      ...(search ? {
        OR: [
          { batchNo: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {})
    };

    const cacheKey = `batches:${orgId}:${status || ''}:${search || ''}:${JSON.stringify(filters)}:p${page}`;

    const { data, totalCount } = await withCache(cacheKey, async () => {
      const [batches, count] = await Promise.all([
        prisma.batch.findMany({
          where,
          include: {
            greyInward: {
              include: {
                customer: true
              }
            },
            printingIssue: {
              include: {
                printer: true
              }
            }
          },
          orderBy: { id: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.batch.count({ where })
      ]);

      const formattedData = batches.map(batch => ({
        ...batch,
        mtrs: batch.mtrs ? Number(batch.mtrs) : 0,
        weight: batch.weight ? Number(batch.weight) : 0,
        rfdMtrs: batch.rfdMtrs ? Number(batch.rfdMtrs) : 0,
        millShortage: batch.millShortage ? Number(batch.millShortage) : 0,
        printMtrs: batch.printMtrs ? Number(batch.printMtrs) : 0,
        printShortage: batch.printShortage ? Number(batch.printShortage) : 0,
        greyInward: {
          ...batch.greyInward,
          totalMtr: Number(batch.greyInward.totalMtr)
        }
      }));

      return { data: formattedData, totalCount: count };
    });

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
export async function deleteGreyInward(id: string) {
  try {
    const orgId = await getOrgId();
    // In warehouse.ts, we don't have checkPermission imported yet, but we should follow the pattern
    // For now, let's just ensure orgId matches
    
    const inward = await prisma.greyInward.findUnique({
      where: { id, organizationId: orgId },
      include: { batches: true }
    });

    if (!inward) return { success: false, error: 'Record not found' };

    // Dependency check: Are any batches processed downstream?
    const isLocked = inward.batches.some(b => 
      b.greyOutwardId || b.rfdInwardId || b.printingIssueId || b.printingReceiveId || b.deliveryChallanId
    );

    if (isLocked) {
      return { success: false, error: 'Cannot delete: Some batches from this inward have already been processed downstream.' };
    }

    // Prisma Cascade Delete will handle the batches if configured, but let's be explicit if needed
    // The schema says onDelete: Cascade for Batch -> greyInward
    await prisma.greyInward.delete({
      where: { id, organizationId: orgId }
    });

    revalidatePath('/dashboard/warehouse');
    await invalidateCache([`inwards:${orgId}`, `batches:${orgId}`]);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting grey inward:', error);
    return { success: false, error: error.message };
  }
}

// --- Bulk Import Action ---

export async function bulkCreateGreyInwards(data: any[]) {
  try {
    const orgId = await getOrgId();
    
    // 1. Fetch all customers for mapping
    const customers = await prisma.customer.findMany({
      where: { organizationId: orgId },
      select: { id: true, customerName: true }
    });

    // 2. Group by Lot No to handle multiple batches per lot
    const lotGroups: Record<string, any> = {};
    
    data.forEach(row => {
      const lotNo = String(row.lotNo || row['Lot No'] || '');
      if (!lotNo) return;

      if (!lotGroups[lotNo]) {
        const customerName = row.customer || row['Customer'] || '';
        const customer = customers.find(c => c.customerName.toLowerCase() === customerName.toLowerCase());
        
        if (!customer) return; // Skip if customer not found

        lotGroups[lotNo] = {
          lotNo,
          date: new Date(row.date || row['Date'] || new Date()),
          challanNo: String(row.challanNo || row['Challan No'] || ''),
          quality: row.quality || row['Quality'] || '',
          processType: row.processType || row['Process Type'] || 'Job Work',
          customerId: customer.id,
          organizationId: orgId,
          totalBatch: 0,
          totalMtr: 0,
          batches: []
        };
      }

      const mtrs = parseFloat(row.mtrs || row['Mtrs'] || 0);
      const pcs = parseInt(row.pcs || row['Pcs'] || 0);
      const weight = parseFloat(row.weight || row['Weight'] || 0);

      lotGroups[lotNo].batches.push({
        batchNo: String(lotGroups[lotNo].batches.length + 1),
        pcs,
        mtrs,
        weight,
        status: 'Ready For Processing'
      });
      
      lotGroups[lotNo].totalBatch += 1;
      lotGroups[lotNo].totalMtr += mtrs;
    });

    // 3. Create using a transaction
    const results = await prisma.$transaction(
      Object.values(lotGroups).map(lot => 
        prisma.greyInward.create({
          data: {
            lotNo: lot.lotNo,
            date: lot.date,
            challanNo: lot.challanNo,
            quality: lot.quality,
            processType: lot.processType,
            totalBatch: lot.totalBatch,
            totalMtr: lot.totalMtr,
            customerId: lot.customerId,
            organizationId: lot.organizationId,
            batches: {
              create: lot.batches
            }
          }
        })
      )
    );

    revalidatePath('/dashboard/warehouse');
    await invalidateCache([`inwards:${orgId}`, `batches:${orgId}`]);
    return { success: true, count: results.length };
  } catch (error: any) {
    console.error('Bulk Warehouse Error:', error);
    return { success: false, error: error.message };
  }
}
