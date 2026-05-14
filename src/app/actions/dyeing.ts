'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { withCache, invalidateCache } from '@/lib/redis';

interface BatchInput {
  id: string;
}

interface DyeingActionData {
  date: string | Date;
  lotNo: string;
  dyeingHouse: string;
  remark?: string;
  dcNo?: string;
  batches: BatchInput[];
}

interface RFDInwardBatchInput {
  id: string;
  rfdMtrs: number;
  isTP: boolean;
  tpDetail?: string;
  millShortage?: number;
}

interface RFDInwardActionData {
  date: string | Date;
  dyeingHouse: string;
  billNo: string;
  challanNo: string;
  lotNo: string;
  remark?: string;
  batches: RFDInwardBatchInput[];
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
    const cacheKey = `dyeing:houses:${orgId}`;
    const vendors = await withCache(cacheKey, async () => {
      return await prisma.vendor.findMany({
        where: { 
          organizationId: orgId,
          status: 'Active'
        },
        orderBy: { vendorName: 'asc' },
      });
    });
    return { success: true, data: vendors };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch dyeing houses' };
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
    return { success: false, error: error.message || 'Failed to fetch DC number' };
  }
}

export async function getGreyInwardsForOutward(search?: string, page: number = 1, pageSize: number = 20) {
  try {
    const orgId = await getOrgId();
    const cacheKey = `dyeing:outward-batches:${orgId}:${search || ''}:p${page}`;
    const where = { 
      organizationId: orgId,
      batches: {
        some: {
          status: 'In-Warehouse'
        }
      },
      ...(search ? { lotNo: { contains: search, mode: 'insensitive' as const } } : {})
    };

    const data = await withCache(cacheKey, async () => {
      const inwards = await prisma.greyInward.findMany({
        where,
        include: {
          batches: {
            where: { status: 'In-Warehouse' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      return inwards.map(inward => ({
        ...inward,
        totalMtr: Number(inward.totalMtr),
        batches: inward.batches.map(batch => ({
          ...batch,
          mtrs: Number(batch.mtrs),
          weight: Number(batch.weight)
        }))
      }));
    });

    const totalCount = await prisma.greyInward.count({ where });

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
        challanNo: data.dcNo,
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
      const allBatches = inward.batches;
      const allOut = allBatches.every(b => b.status === 'Out For RFD' || b.status === 'Ready for Printing');
      const someOut = allBatches.some(b => b.status === 'Out For RFD' || b.status === 'Ready for Printing');
      
      await prisma.greyInward.update({
        where: { id: inward.id },
        data: {
          status: allOut ? 'Out For RFD' : someOut ? 'Started' : 'In-Warehouse'
        }
      });
    }

    revalidatePath('/dashboard/dyeing-house');
    revalidatePath('/dashboard/warehouse');
    await invalidateCache([`dyeing:outward-batches:${orgId}`, `dyeing:outwards:${orgId}`, `batches:${orgId}`]);
    return { success: true, data: greyOutward };
  } catch (error: any) {
    console.error('Error creating grey outward:', error);
    return { success: false, error: error.message };
  }
}

export async function updateGreyOutward(id: string, data: DyeingActionData) {
  try {
    const orgId = await getOrgId();
    const greyOutward = await prisma.greyOutward.update({
      where: { id, organizationId: orgId },
      data: {
        date: new Date(data.date),
        lotNo: data.lotNo,
        dyeingHouseId: data.dyeingHouse,
        remark: data.remark,
        challanNo: data.dcNo,
      },
    });
    revalidatePath('/dashboard/dyeing');
    await invalidateCache([`dyeing:outward-batches:${orgId}`, `dyeing:outwards:${orgId}`, `batches:${orgId}`]);
    return { success: true, data: greyOutward };
  } catch (error: any) {
    console.error('Error updating grey outward:', error);
    return { success: false, error: error.message };
  }
}

export async function updateRFDInward(id: string, data: RFDInwardActionData) {
  try {
    const orgId = await getOrgId();
    const rfdInward = await prisma.rFDInward.update({
      where: { id, organizationId: orgId },
      data: {
        date: new Date(data.date),
        lotNo: data.lotNo,
        dyeingHouseId: data.dyeingHouse,
        billNo: data.billNo,
        challanNo: data.challanNo,
        remark: data.remark,
      },
    });
    revalidatePath('/dashboard/dyeing-house');
    await invalidateCache([`dyeing:rfd-inwards:${orgId}`, `batches:${orgId}`]);
    return { success: true, data: rfdInward };
  } catch (error: any) {
    console.error('Error updating RFD inward:', error);
    return { success: false, error: error.message };
  }
}

export async function getGreyOutwards(search?: string, filters: any = {}, page: number = 1, pageSize: number = 20) {
  try {
    const orgId = await getOrgId();
    const cacheKey = `dyeing:outwards:${orgId}:${search || ''}:${JSON.stringify(filters)}:p${page}`;
    const where = { 
      organizationId: orgId,
      ...(search ? {
        OR: [
          { lotNo: { contains: search, mode: 'insensitive' as const } },
          { challanNo: { contains: search, mode: 'insensitive' as const } },
          { dyeingHouse: { vendorName: { contains: search, mode: 'insensitive' as const } } }
        ]
      } : {}),
      ...(filters.entityId ? { dyeingHouseId: filters.entityId } : {}),
      ...(filters.startDate && filters.endDate ? {
        date: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        }
      } : {}),
    };
    
    const data = await withCache(cacheKey, async () => {
      const outwards = await prisma.greyOutward.findMany({
        where,
        include: {
          dyeingHouse: true,
          batches: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // Fetch all batches for these lots to handle status tracking
      const lotNos = Array.from(new Set(outwards.map(o => o.lotNo)));
      const inwards = await prisma.greyInward.findMany({
        where: {
          lotNo: { in: lotNos },
          organizationId: orgId
        },
        include: { batches: true }
      });

      return outwards.map(outward => {
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
    });

    const totalCount = await prisma.greyOutward.count({ where });

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

export async function createRFDInward(data: RFDInwardActionData) {
    try {
      const orgId = await getOrgId();
      
      // 1. Create the RFDInward record
      const rfdInward = await prisma.rFDInward.create({
        data: {
          date: new Date(data.date),
          lotNo: data.lotNo,
          dyeingHouseId: data.dyeingHouse,
          billNo: data.billNo,
          challanNo: data.challanNo,
          remark: data.remark,
          organizationId: orgId,
          batches: {
            connect: data.batches.map((b) => ({ id: b.id }))
          }
        },
      });

      // 2. Update each batch with its RFD specific data and status
      for (const batchData of data.batches) {
        // Fetch original batch to get related IDs for splitting
        const originalBatch = await prisma.batch.findUnique({
          where: { id: batchData.id }
        });

        if (!originalBatch) continue;

        if (batchData.isTP && batchData.tpDetail) {
          const parts = batchData.tpDetail.split(/[+\s,]+/).map(p => parseFloat(p)).filter(p => !isNaN(p));
          
          if (parts.length > 0) {
            // Update the original batch with the first part
            await prisma.batch.update({
              where: { id: batchData.id },
              data: {
                status: 'Ready for Printing',
                rfdMtrs: parts[0],
                isTP: true,
                tpDetail: batchData.tpDetail,
                millShortage: batchData.millShortage,
                rfdInwardId: rfdInward.id
              }
            });

            // Create new batches for the remaining parts
            for (let i = 1; i < parts.length; i++) {
              await prisma.batch.create({
                data: {
                  batchNo: `${originalBatch.batchNo} (P${i + 1})`,
                  mtrs: 0, // 0 grey meters to avoid double counting
                  weight: 0,
                  status: 'Ready for Printing',
                  rfdMtrs: parts[i],
                  isTP: true,
                  tpDetail: batchData.tpDetail,
                  greyInwardId: originalBatch.greyInwardId,
                  greyOutwardId: originalBatch.greyOutwardId,
                  rfdInwardId: rfdInward.id
                }
              });
            }
          }
        } else {
          // Standard update for non-TP batches
          await prisma.batch.update({
            where: { id: batchData.id },
            data: {
              status: 'Ready for Printing',
              rfdMtrs: batchData.rfdMtrs,
              isTP: false,
              tpDetail: batchData.tpDetail,
              millShortage: batchData.millShortage,
              rfdInwardId: rfdInward.id
            }
          });
        }
      }

      // 3. Update parent GreyInward status
      const inward = await prisma.greyInward.findFirst({
        where: { 
          lotNo: data.lotNo,
          organizationId: orgId
        },
        include: { batches: true }
      });

      if (inward) {
        const allBatches = inward.batches;
        const allRFD = allBatches.every(b => b.status === 'Ready for Printing');
        await prisma.greyInward.update({
          where: { id: inward.id },
          data: {
            status: allRFD ? 'Ready for Printing' : 'Out For RFD'
          }
        });
      }
  
      revalidatePath('/dashboard/dyeing-house');
      revalidatePath('/dashboard/warehouse');
      await invalidateCache([`dyeing:rfd-inwards:${orgId}`, `dyeing:outwards:${orgId}`, `batches:${orgId}`]);
      return { success: true, data: rfdInward };
    } catch (error: any) {
      console.error('Error creating RFD inward:', error);
      return { success: false, error: error.message };
    }
  }

export async function getGreyOutwardsByHouse(dyeingHouseId: string) {
  try {
    const orgId = await getOrgId();
    const cacheKey = `dyeing:outwards-by-house:${orgId}:${dyeingHouseId}`;
    const data = await withCache(cacheKey, async () => {
      const outwards = await prisma.greyOutward.findMany({
        where: { 
          organizationId: orgId,
          dyeingHouseId: dyeingHouseId,
          batches: {
            some: {
              status: 'Out For RFD'
            }
          }
        },
        include: {
          batches: {
            where: { status: 'Out For RFD' }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return outwards.map(outward => ({
        ...outward,
        batches: outward.batches.map(batch => ({
          ...batch,
          mtrs: Number(batch.mtrs),
          weight: Number(batch.weight)
        }))
      }));
    });
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRFDInwards(search?: string, filters: { entityId?: string; startDate?: string; endDate?: string } = {}, page: number = 1, pageSize: number = 20) {
  try {
    const orgId = await getOrgId();
    const cacheKey = `dyeing:rfd-inwards:${orgId}:${search || ''}:${JSON.stringify(filters)}:p${page}`;
    const where = { 
      organizationId: orgId,
      ...(search ? {
        OR: [
          { lotNo: { contains: search, mode: 'insensitive' as const } },
          { billNo: { contains: search, mode: 'insensitive' as const } },
          { challanNo: { contains: search, mode: 'insensitive' as const } },
          { dyeingHouse: { vendorName: { contains: search, mode: 'insensitive' as const } } }
        ]
      } : {}),
      ...(filters.entityId ? { dyeingHouseId: filters.entityId } : {}),
      ...(filters.startDate && filters.endDate ? {
        date: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        }
      } : {}),
    };

    const data = await withCache(cacheKey, async () => {
      const outwards = await prisma.rFDInward.findMany({
        where,
        include: {
          dyeingHouse: true,
          batches: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return outwards.map(inward => ({
        ...inward,
        batches: inward.batches.map(batch => ({
          ...batch,
          mtrs: Number(batch.mtrs),
          weight: Number(batch.weight),
          rfdMtrs: Number(batch.rfdMtrs),
          millShortage: Number(batch.millShortage)
        }))
      }));
    });

    const totalCount = await prisma.rFDInward.count({ where });

    return { 
      success: true, 
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch RFD inwards' };
  }
}

export async function getReadyForPrintingBatches() {
  try {
    const orgId = await getOrgId();
    const batches = await prisma.batch.findMany({
      where: {
        greyInward: { organizationId: orgId },
        status: 'Ready for Printing'
      },
      include: {
        greyInward: {
          include: { customer: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const serializedData = batches.map(batch => ({
      ...batch,
      mtrs: Number(batch.mtrs),
      rfdMtrs: Number(batch.rfdMtrs),
      millShortage: Number(batch.millShortage),
      greyInward: {
        ...batch.greyInward,
        totalMtr: Number(batch.greyInward.totalMtr)
      }
    }));

    return { success: true, data: serializedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function deleteGreyOutward(id: string) {
  try {
    const orgId = await getOrgId();
    const outward = await prisma.greyOutward.findUnique({
      where: { id, organizationId: orgId },
      include: { batches: true }
    });

    if (!outward) return { success: false, error: 'Record not found' };

    // Dependency check
    const isLocked = outward.batches.some(b => b.rfdInwardId);
    if (isLocked) {
      return { success: false, error: 'Cannot delete: Some batches from this outward have already been inwarded from RFD.' };
    }

    // Revert batch status
    await prisma.batch.updateMany({
      where: { id: { in: outward.batches.map(b => b.id) } },
      data: { status: 'In-Warehouse' }
    });

    // Delete record
    await prisma.greyOutward.delete({
      where: { id, organizationId: orgId }
    });

    // Update parent GreyInward status
    const inward = await prisma.greyInward.findFirst({
      where: { lotNo: outward.lotNo, organizationId: orgId },
      include: { batches: true }
    });

    if (inward) {
      const someOut = inward.batches.some(b => b.status === 'Out For RFD' || b.status === 'Ready for Printing');
      await prisma.greyInward.update({
        where: { id: inward.id },
        data: { status: someOut ? 'Started' : 'In-Warehouse' }
      });
    }

    revalidatePath('/dashboard/dyeing-house');
    revalidatePath('/dashboard/warehouse');
    await invalidateCache([`dyeing:outwards:${orgId}`, `dyeing:outwards-by-house:${orgId}`, `batches:${orgId}`]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRFDInward(id: string) {
  try {
    const orgId = await getOrgId();
    const outward = await prisma.rFDInward.findUnique({
      where: { id, organizationId: orgId },
      include: { batches: true }
    });

    if (!outward) return { success: false, error: 'Record not found' };

    // Dependency check
    const isLocked = outward.batches.some(b => b.printingIssueId);
    if (isLocked) {
      return { success: false, error: 'Cannot delete: Some batches from this inward have already been issued for printing.' };
    }

    // Revert batch status
    await prisma.batch.updateMany({
      where: { id: { in: outward.batches.map(b => b.id) } },
      data: { 
        status: 'Out For RFD',
        rfdMtrs: null,
        isTP: false,
        tpDetail: null,
        millShortage: null,
        rfdInwardId: null
      }
    });

    // Delete record
    await prisma.rFDInward.delete({
      where: { id, organizationId: orgId }
    });

    // Update parent GreyInward status
    const inward = await prisma.greyInward.findFirst({
      where: { lotNo: outward.lotNo, organizationId: orgId },
      include: { batches: true }
    });

    if (inward) {
      const allRFD = inward.batches.every(b => b.status === 'Ready for Printing');
      await prisma.greyInward.update({
        where: { id: inward.id },
        data: { status: allRFD ? 'Ready for Printing' : 'Out For RFD' }
      });
    }

    revalidatePath('/dashboard/dyeing-house');
    revalidatePath('/dashboard/warehouse');
    await invalidateCache([`dyeing:rfd-inwards:${orgId}`, `batches:${orgId}`]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Bulk Import Action ---

export async function bulkCreateGreyOutwards(data: any[]) {
  try {
    const orgId = await getOrgId();
    
    // 1. Fetch vendors and inwards for mapping
    const [vendors, inwards] = await Promise.all([
      prisma.vendor.findMany({ where: { organizationId: orgId } }),
      prisma.greyInward.findMany({ 
        where: { organizationId: orgId },
        include: { batches: true }
      })
    ]);

    const results = await prisma.$transaction(
      data.map(row => {
        const lotNo = String(row.lotNo || row['Lot No'] || '');
        const dyeingHouseName = row.dyeingHouse || row['Dyeing House'] || '';
        
        const vendor = vendors.find(v => v.vendorName.toLowerCase() === dyeingHouseName.toLowerCase());
        const inward = inwards.find(i => i.lotNo === lotNo);

        if (!inward || !vendor) return null;

        return prisma.greyOutward.create({
          data: {
            date: new Date(row.date || row['Date'] || new Date()),
            lotNo,
            dyeingHouseId: vendor.id,
            remark: row.remark || row['Remark'] || '',
            challanNo: String(row.dcNo || row['DC No'] || ''),
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
        greyInward: { lotNo: { in: lotNos }, organizationId: orgId },
        status: 'In-Warehouse'
      },
      data: { status: 'Out For RFD' }
    });

    // Update inward statuses
    await prisma.greyInward.updateMany({
      where: { lotNo: { in: lotNos }, organizationId: orgId },
      data: { status: 'Out For RFD' }
    });

    revalidatePath('/dashboard/dyeing-house');
    revalidatePath('/dashboard/warehouse');
    await invalidateCache([`dyeing:outwards:${orgId}`, `batches:${orgId}`]);
    return { success: true, count: results.length };
  } catch (error: any) {
    console.error('Bulk Dyeing Error:', error);
    return { success: false, error: error.message };
  }
}
