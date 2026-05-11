/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { Batch } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function getOrgId() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('org_id')?.value;
  if (!orgId) throw new Error('Unauthorized: No organization ID found');
  return orgId;
}

export async function getPrinters() {
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

export async function getReadyForPrintingLots() {
  try {
    const orgId = await getOrgId();
    // A lot is ready for printing if it has batches with status 'Ready for Printing'
    const inwards = await prisma.greyInward.findMany({
      where: {
        organizationId: orgId,
        batches: {
          some: { status: 'Ready for Printing' }
        }
      },
      include: {
        customer: true,
        batches: {
          where: { status: 'Ready for Printing' },
          include: {
            rfdInward: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const serializedData = inwards.map(inward => {
      const groupedBatches: any[] = [];
      inward.batches.forEach((batch: any) => {
        const baseBatchNo = batch.batchNo.split(' (P')[0];
        const existing = groupedBatches.find(b => b.batchNo === baseBatchNo);
        if (existing) {
          existing.ids.push(batch.id);
          existing.mtrs += Number(batch.mtrs);
          existing.rfdMtrs += Number(batch.rfdMtrs);
        } else {
          groupedBatches.push({
            ...batch,
            ids: [batch.id],
            mtrs: Number(batch.mtrs),
            rfdMtrs: Number(batch.rfdMtrs),
            batchNo: baseBatchNo
          });
        }
      });

      return {
        ...inward,
        totalMtr: Number(inward.totalMtr),
        batches: groupedBatches
      };
    });

    return { success: true, data: serializedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPrintingIssue(data: any) {
  try {
    const orgId = await getOrgId();
    
    const issue = await prisma.printingIssue.create({
      data: {
        jobCardNumber: data.jobCardNumber,
        date: new Date(data.date),
        lotNo: data.lotNo,
        remark: data.remark,
        organizationId: orgId,
        batches: {
          connect: data.batches.flatMap((b: any) => (b.ids || [b.id]).map((id: string) => ({ id })))
        }
      }
    });

    const allIds = data.batches.flatMap((b: any) => (b.ids || [b.id]));
    await prisma.batch.updateMany({
      where: { id: { in: allIds } },
      data: { status: 'Under Printing' }
    });

    revalidatePath('/dashboard/printing-process');
    return { success: true, data: issue };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePrintingIssue(id: string, data: any) {
  try {
    const orgId = await getOrgId();
    const issue = await prisma.printingIssue.update({
      where: { id, organizationId: orgId },
      data: {
        jobCardNumber: data.jobCardNumber,
        date: new Date(data.date),
        lotNo: data.lotNo,
        remark: data.remark,
        printerId: data.printerId,
      },
    });
    revalidatePath('/dashboard/printing-process');
    return { success: true, data: issue };
  } catch (error: any) {
    console.error('Error updating printing issue:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePrintingReceive(id: string, data: any) {
  try {
    const orgId = await getOrgId();
    const receive = await prisma.printingReceive.update({
      where: { id, organizationId: orgId },
      data: {
        productionNumber: data.productionNumber,
        date: new Date(data.date),
        lotNo: data.lotNo,
        printerId: data.printerId,
        processType: data.processType,
        customerId: data.customerId,
        billNo: data.billNo,
        challanNo: data.challanNo,
        remark: data.remark,
      },
    });
    revalidatePath('/dashboard/printing-process');
    return { success: true, data: receive };
  } catch (error: any) {
    console.error('Error updating printing receive:', error);
    return { success: false, error: error.message };
  }
}

export async function getOutForPrintingLots(search?: string) {
  try {
    const orgId = await getOrgId();
    const issues = await prisma.printingIssue.findMany({
      where: { 
        organizationId: orgId,
        ...(search ? {
          OR: [
            { jobCardNumber: { contains: search, mode: 'insensitive' } },
            { lotNo: { contains: search, mode: 'insensitive' } },
            { printer: { vendorName: { contains: search, mode: 'insensitive' } } },
            { batches: { some: { greyInward: { customer: { customerName: { contains: search, mode: 'insensitive' } } } } } }
          ]
        } : {})
      },
      include: {
        printer: true,
        batches: {
          where: { status: 'Under Printing' },
          include: {
            greyInward: {
              include: { customer: true }
            },
            rfdInward: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedData = issues.filter(i => i.batches.length > 0).map(issue => {
      const groupedBatches: any[] = [];
      issue.batches.forEach((batch: any) => {
        const baseBatchNo = batch.batchNo.split(' (P')[0];
        const existing = groupedBatches.find(b => b.batchNo === baseBatchNo);
        if (existing) {
          existing.ids.push(batch.id);
          existing.mtrs += Number(batch.mtrs);
          existing.rfdMtrs += Number(batch.rfdMtrs);
        } else {
          groupedBatches.push({
            ...batch,
            ids: [batch.id],
            mtrs: Number(batch.mtrs),
            rfdMtrs: Number(batch.rfdMtrs),
            batchNo: baseBatchNo
          });
        }
      });

      return {
        ...issue,
        customer: issue.batches[0]?.greyInward?.customer,
        processType: issue.batches[0]?.greyInward?.processType,
        billNo: issue.batches[0]?.rfdInward?.billNo,
        batches: groupedBatches
      };
    });

    return { success: true, data: serializedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPrintingReceives(search?: string) {
  try {
    const orgId = await getOrgId();
    const receives = await prisma.printingReceive.findMany({
      where: { 
        organizationId: orgId,
        ...(search ? {
          OR: [
            { productionNumber: { contains: search, mode: 'insensitive' } },
            { lotNo: { contains: search, mode: 'insensitive' } },
            { printer: { vendorName: { contains: search, mode: 'insensitive' } } },
            { customer: { customerName: { contains: search, mode: 'insensitive' } } }
          ]
        } : {})
      },
      include: {
        printer: true,
        customer: true,
        batches: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedData = receives.map(receive => ({
      ...receive,
      batches: receive.batches.map(batch => ({
        ...batch,
        mtrs: Number(batch.mtrs || 0),
        rfdMtrs: Number(batch.rfdMtrs || 0),
        printMtrs: Number(batch.printMtrs || 0),
        printShortage: Number(batch.printShortage || 0)
      }))
    }));

    return { success: true, data: serializedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextJobCardNumber() {
  try {
    const orgId = await getOrgId();
    const count = await prisma.printingIssue.count({
      where: { organizationId: orgId }
    });
    return { success: true, data: `JC-${count + 755}` }; // Job Card series
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextReceiveProductionNumber() {
  try {
    const orgId = await getOrgId();
    const count = await prisma.printingReceive.count({
      where: { organizationId: orgId }
    });
    return { success: true, data: `PRN-${count + 1001}` }; // Production Number series for Receive
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPrintingReceive(data: any) {
  try {
    const orgId = await getOrgId();
    
    // Explicitly define the data to avoid potential type issues during generation lag
    const receiveData: any = {
      productionNumber: data.productionNumber,
      date: new Date(data.date),
      lotNo: data.lotNo,
      printerId: data.printerId,
      processType: data.processType,
      customerId: data.customerId,
      billNo: data.billNo,
      challanNo: data.challanNo,
      remark: data.remark,
      organizationId: orgId,
      batches: {
        connect: data.batches.flatMap((b: any) => (b.ids || [b.id]).map((id: string) => ({ id })))
      }
    };

    const receive = await prisma.printingReceive.create({
      data: receiveData
    });

    const updates = [];
    for (const batch of data.batches) {
      const ids = batch.ids || [batch.id];
      
      if (ids.length > 1) {
        // Handle grouped batches (from TP split)
        const parts = batch.isTP ? batch.tpDetail.split(/[+\s,]+/).map((p: string) => parseFloat(p)).filter((p: number) => !isNaN(p)) : [];
        
        // Fetch batches to know their original rfdMtrs for distribution
        const originalBatches = await prisma.batch.findMany({ where: { id: { in: ids } } });
        const sortedOriginals = originalBatches.sort((a, b) => a.batchNo.localeCompare(b.batchNo));

        for (let i = 0; i < ids.length; i++) {
          const original = sortedOriginals[i];
          let finish = 0;
          
          if (parts.length > i) {
            finish = parts[i];
          } else if (i === 0) {
            finish = batch.printMtrs; // Fallback to full amount on first part
          } else {
            finish = 0;
          }

          const rfd = Number(original.rfdMtrs || 1);
          const shortage = ((rfd - finish) / rfd) * 100;

          updates.push(prisma.batch.update({
            where: { id: original.id },
            data: {
              status: 'Ready For Dispatch',
              printMtrs: Number(finish.toFixed(2)),
              printShortage: Number(shortage.toFixed(2)),
              printingReceiveId: receive.id
            }
          }));
        }
      } else {
        // Standard single batch update
        updates.push(prisma.batch.update({
          where: { id: batch.id },
          data: {
            status: 'Ready For Dispatch',
            printMtrs: batch.printMtrs,
            printShortage: batch.printShortage,
            printingReceiveId: receive.id
          }
        }));
      }
    }

    await prisma.$transaction(updates);

    revalidatePath('/dashboard/printing-process');
    revalidatePath('/dashboard/warehouse');
    revalidatePath('/dashboard/warehouse', 'layout');
    return { success: true, data: receive };
  } catch (error: any) {
    console.error('Error creating printing receive:', error);
    return { success: false, error: error.message };
  }
}
export async function deletePrintingIssue(id: string) {
  try {
    const orgId = await getOrgId();
    const issue = await prisma.printingIssue.findUnique({
      where: { id, organizationId: orgId },
      include: { batches: true }
    });

    if (!issue) return { success: false, error: 'Record not found' };

    // Dependency check: Are any batches received back from Printing?
    const isLocked = issue.batches.some(b => b.printingReceiveId);
    if (isLocked) {
      return { success: false, error: 'Cannot delete: Some batches from this issue have already been received.' };
    }

    // Revert batch status
    await prisma.batch.updateMany({
      where: { id: { in: issue.batches.map(b => b.id) } },
      data: { status: 'Ready for Printing' }
    });

    // Delete record
    await prisma.printingIssue.delete({
      where: { id, organizationId: orgId }
    });

    revalidatePath('/dashboard/printing-process');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePrintingReceive(id: string) {
  try {
    const orgId = await getOrgId();
    const receive = await prisma.printingReceive.findUnique({
      where: { id, organizationId: orgId },
      include: { batches: true }
    });

    if (!receive) return { success: false, error: 'Record not found' };

    // Dependency check: Are any batches in a delivery challan?
    const isLocked = receive.batches.some(b => b.deliveryChallanId);
    if (isLocked) {
      return { success: false, error: 'Cannot delete: Some batches from this receipt have already been dispatched.' };
    }

    // Revert batch status and clear Print fields
    await prisma.batch.updateMany({
      where: { id: { in: receive.batches.map(b => b.id) } },
      data: { 
        status: 'Under Printing',
        printMtrs: null,
        printShortage: null,
        printingReceiveId: null
      }
    });

    // Delete record
    await prisma.printingReceive.delete({
      where: { id, organizationId: orgId }
    });

    revalidatePath('/dashboard/printing-process');
    revalidatePath('/dashboard/warehouse');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
