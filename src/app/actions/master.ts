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

export async function getCustomers(search?: string, filters: any = {}) {
  try {
    const { orgId } = await getSessionContext();
    const customers = await prisma.customer.findMany({
      where: { 
        organizationId: orgId,
        ...(search ? { customerName: { contains: search, mode: 'insensitive' } } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { customerName: 'asc' },
    });
    return { success: true, data: customers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    const { orgId } = await getSessionContext();
    if (!await checkPermission('module:master')) {
      return { success: false, error: 'Permission denied' };
    }

    const customer = await prisma.customer.update({
      where: { id, organizationId: orgId },
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
      },
    });
    revalidatePath('/dashboard/master');
    return { success: true, data: customer };
  } catch (error: any) {
    console.error('Error updating customer:', error);
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

export async function getVendors(search?: string, filters: any = {}) {
  try {
    const { orgId } = await getSessionContext();
    const vendors = await prisma.vendor.findMany({
      where: { 
        organizationId: orgId,
        ...(search ? { vendorName: { contains: search, mode: 'insensitive' } } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { vendorName: 'asc' },
    });
    return { success: true, data: vendors };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateVendor(id: string, data: any) {
  try {
    const { orgId } = await getSessionContext();
    if (!await checkPermission('module:master')) {
      return { success: false, error: 'Permission denied' };
    }

    const vendor = await prisma.vendor.update({
      where: { id, organizationId: orgId },
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
      },
    });
    revalidatePath('/dashboard/master');
    return { success: true, data: vendor };
  } catch (error: any) {
    console.error('Error updating vendor:', error);
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

export async function getItems(search?: string, filters: any = {}) {
  try {
    const { orgId } = await getSessionContext();
    const items = await prisma.item.findMany({
      where: { 
        organizationId: orgId,
        ...(search ? { itemName: { contains: search, mode: 'insensitive' } } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { itemName: 'asc' },
    });
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateItem(id: string, data: any) {
  try {
    const { orgId } = await getSessionContext();
    if (!await checkPermission('module:master')) {
      return { success: false, error: 'Permission denied' };
    }

    const item = await prisma.item.update({
      where: { id, organizationId: orgId },
      data: {
        itemName: data.itemName,
        sku: data.sku,
      },
    });
    revalidatePath('/dashboard/master');
    return { success: true, data: item };
  } catch (error: any) {
    console.error('Error updating item:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const { orgId } = await getSessionContext();
    await checkPermission('module:master');

    const count = await prisma.greyInward.count({
      where: { customerId: id, organizationId: orgId }
    });

    if (count > 0) {
      return { success: false, error: 'Cannot delete customer with existing inward records.' };
    }

    await prisma.customer.delete({
      where: { id, organizationId: orgId }
    });

    revalidatePath('/dashboard/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete customer' };
  }
}

export async function deleteVendor(id: string) {
  try {
    const { orgId } = await getSessionContext();
    await checkPermission('module:master');

    const [outwardCount, rfdCount, printingCount] = await Promise.all([
      prisma.greyOutward.count({ where: { dyeingHouseId: id, organizationId: orgId } }),
      prisma.rFDInward.count({ where: { dyeingHouseId: id, organizationId: orgId } }),
      prisma.printingIssue.count({ where: { printerId: id, organizationId: orgId } })
    ]);

    if (outwardCount > 0 || rfdCount > 0 || printingCount > 0) {
      return { success: false, error: 'Cannot delete vendor with existing transactions.' };
    }

    await prisma.vendor.delete({
      where: { id, organizationId: orgId }
    });

    revalidatePath('/dashboard/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete vendor' };
  }
}

export async function deleteItem(id: string) {
  try {
    const { orgId } = await getSessionContext();
    await checkPermission('module:master');

    const item = await prisma.item.findUnique({ where: { id } });
    if (item) {
      const inwardCount = await prisma.greyInward.count({
        where: { quality: item.itemName, organizationId: orgId }
      });
      if (inwardCount > 0) {
        return { success: false, error: 'Cannot delete item currently used in inwards.' };
      }
    }

    await prisma.item.delete({
      where: { id, organizationId: orgId }
    });

    revalidatePath('/dashboard/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete item' };
  }
}

// --- Bulk Import Actions ---

export async function bulkCreateCustomers(data: any[]) {
  try {
    const { orgId } = await getSessionContext();
    if (!await checkPermission('module:master')) {
      return { success: false, error: 'Permission denied' };
    }

    const customers = await prisma.customer.createMany({
      data: data.map(item => ({
        customerName: item.customerName || item['Customer Name'] || '',
        status: item.status || 'Active',
        addressLine1: item.addressLine1 || item['Address'] || '',
        city: item.city || item['City'] || '',
        state: item.state || item['State'] || '',
        postalCode: String(item.postalCode || item['Pincode'] || ''),
        phone: String(item.phone || item['Phone'] || ''),
        gstin: item.gstin || item['GSTIN'] || '',
        organizationId: orgId,
      })),
      skipDuplicates: true
    });

    revalidatePath('/dashboard/master');
    return { success: true, count: customers.count };
  } catch (error: any) {
    console.error('Bulk Customer Error:', error);
    return { success: false, error: error.message };
  }
}

export async function bulkCreateVendors(data: any[]) {
  try {
    const { orgId } = await getSessionContext();
    if (!await checkPermission('module:master')) {
      return { success: false, error: 'Permission denied' };
    }

    const vendors = await prisma.vendor.createMany({
      data: data.map(item => ({
        vendorName: item.vendorName || item['Vendor Name'] || '',
        masterName: item.masterName || item['Contact Person'] || '',
        status: item.status || 'Active',
        gstin: item.gstin || item['GSTIN'] || '',
        city: item.city || item['City'] || '',
        state: item.state || item['State'] || '',
        organizationId: orgId,
      })),
      skipDuplicates: true
    });

    revalidatePath('/dashboard/master');
    return { success: true, count: vendors.count };
  } catch (error: any) {
    console.error('Bulk Vendor Error:', error);
    return { success: false, error: error.message };
  }
}

export async function bulkCreateItems(data: any[]) {
  try {
    const { orgId } = await getSessionContext();
    if (!await checkPermission('module:master')) {
      return { success: false, error: 'Permission denied' };
    }

    const items = await prisma.item.createMany({
      data: data.map(item => ({
        itemName: item.itemName || item['Item Name'] || '',
        sku: item.sku || item['SKU'] || '',
        organizationId: orgId,
      })),
      skipDuplicates: true
    });

    revalidatePath('/dashboard/master');
    return { success: true, count: items.count };
  } catch (error: any) {
    console.error('Bulk Item Error:', error);
    return { success: false, error: error.message };
  }
}
