'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { checkPermission } from '@/lib/dal';

async function getSessionContext() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('org_id')?.value;
  
  if (!orgId) throw new Error('Unauthorized: Missing session context');
  return { orgId };
}

// --- Customer Actions ---

export async function createCustomer(data: any) {
  try {
    const { orgId } = await getSessionContext();
    
    if (!await checkPermission('module:master')) {
      return { success: false, error: 'Permission denied' };
    }

    const customer = await prisma.customer.create({
      data: {
        customerName: data.customerName,
        status: data.status,
        address: data.address,
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
        gstin: data.gstin,
        organizationId: orgId,
      },
    });
    revalidatePath('/dashboard/master');
    return { success: true, data: customer };
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return { success: false, error: error.message };
  }
}

export async function getCustomers() {
  try {
    const { orgId } = await getSessionContext();
    const customers = await prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { customerName: 'asc' },
    });
    return { success: true, data: customers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Vendor Actions ---

export async function createVendor(data: any) {
  try {
    const { orgId } = await getSessionContext();

    if (!await checkPermission('module:master')) {
      return { success: false, error: 'Permission denied' };
    }

    const vendor = await prisma.vendor.create({
      data: {
        vendorName: data.vendorName,
        masterName: data.masterName,
        vendorNumber: data.vendorNumber,
        booksId: data.booksId,
        gstin: data.gstin,
        status: data.status,
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        organizationId: orgId,
      },
    });
    revalidatePath('/dashboard/master');
    return { success: true, data: vendor };
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return { success: false, error: error.message };
  }
}

export async function getVendors() {
  try {
    const { orgId } = await getSessionContext();
    const vendors = await prisma.vendor.findMany({
      where: { organizationId: orgId },
      orderBy: { vendorName: 'asc' },
    });
    return { success: true, data: vendors };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDashboardStats() {
  try {
    const { orgId } = await getSessionContext();
    const [customerCount, vendorCount, itemCount] = await Promise.all([
      prisma.customer.count({ where: { organizationId: orgId } }),
      prisma.vendor.count({ where: { organizationId: orgId } }),
      prisma.item.count({ where: { organizationId: orgId } }),
    ]);
    return { 
      success: true, 
      stats: {
        customers: customerCount,
        vendors: vendorCount,
        items: itemCount
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Item Actions ---

export async function createItem(data: any) {
  try {
    const { orgId } = await getSessionContext();
    if (!await checkPermission('module:master')) {
      return { success: false, error: 'Permission denied' };
    }

    const item = await prisma.item.create({
      data: {
        itemName: data.itemName,
        sku: data.sku,
        organizationId: orgId,
      },
    });
    revalidatePath('/dashboard/master');
    return { success: true, data: item };
  } catch (error: any) {
    console.error('Error creating item:', error);
    return { success: false, error: error.message };
  }
}

export async function getItems() {
  try {
    const { orgId } = await getSessionContext();
    const items = await prisma.item.findMany({
      where: { organizationId: orgId },
      orderBy: { itemName: 'asc' },
    });
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
