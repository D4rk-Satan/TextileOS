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
          where: { status: 'Ready for Printing' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const serializedData = inwards.map(inward => ({
      ...inward,
      totalMtr: Number(inward.totalMtr),
      batches: inward.batches.map(batch => ({
        ...batch,
        mtrs: Number(batch.mtrs),
        rfdMtrs: Number(batch.rfdMtrs)
      }))
    }));

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
        date: new Date(data.date),
        lotNo: data.lotNo,
        printerId: data.printerId,
        challanNo: data.dcNo,
        remark: data.remark,
        organizationId: orgId,
        batches: {
          connect: data.batches.map((b: any) => ({ id: b.id }))
        }
      }
    });

    await prisma.batch.updateMany({
      where: { id: { in: data.batches.map((b: any) => b.id) } },
      data: { status: 'Under Printing' }
    });

    revalidatePath('/dashboard/printing-process');
    return { success: true, data: issue };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOutForPrintingLots() {
  try {
    const orgId = await getOrgId();
    const issues = await prisma.printingIssue.findMany({
      where: { organizationId: orgId },
      include: {
        printer: true,
        batches: {
          where: { status: 'Under Printing' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedData = issues.filter((i: any) => i.batches.length > 0).map((issue: any) => ({
      ...issue,
      batches: issue.batches.map((batch: any) => ({
        ...batch,
        mtrs: Number(batch.mtrs),
        rfdMtrs: Number(batch.rfdMtrs)
      }))
    }));

    return { success: true, data: serializedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextProductionNumber() {
  try {
    const orgId = await getOrgId();
    const count = await prisma.printingReceive.count({
      where: { organizationId: orgId }
    });
    return { success: true, data: `JC-${count + 755}` }; // Starting from 755 as per user image
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
        connect: data.batches.map((b: any) => ({ id: b.id }))
      }
    };

    const receive = await prisma.printingReceive.create({
      data: receiveData
    });

    // Use a transaction for better reliability
    await prisma.$transaction(
      data.batches.map((batch: any) => 
        prisma.batch.update({
          where: { id: batch.id },
          data: {
            status: 'Ready For Dispatch',
            printMtrs: batch.printMtrs,
            printShortage: batch.printShortage,
            printingReceiveId: receive.id
          }
        })
      )
    );

    revalidatePath('/dashboard/printing-process');
    revalidatePath('/dashboard/warehouse');
    revalidatePath('/dashboard/warehouse', 'layout');
    return { success: true, data: receive };
  } catch (error: any) {
    console.error('Error creating printing receive:', error);
    return { success: false, error: error.message };
  }
}
