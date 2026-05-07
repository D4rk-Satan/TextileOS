'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/permissions';

import { checkPermission } from '@/lib/dal';

async function getSessionContext() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('org_id')?.value;
  
  if (!orgId) throw new Error('Unauthorized: Missing session context');
  return { orgId };
}

export async function getRoles() {
  console.time('getRoles-action');
  try {
    const { orgId } = await getSessionContext();
    console.log('Fetching roles for org:', orgId);
    
    const roles = await (prisma as any).appRole.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
      take: 50 // Limit results for safety
    });
    
    console.timeEnd('getRoles-action');
    return { success: true, data: roles };
  } catch (error: any) {
    console.timeEnd('getRoles-action');
    console.error('getRoles Error:', error);
    return { success: false, error: error.message };
  }
}

export async function createRole(data: { name: string; permissions: string[] }) {
  try {
    const { orgId } = await getSessionContext();
    
    if (!await checkPermission('settings:roles')) {
      return { success: false, error: 'Permission denied' };
    }

    const newRole = await (prisma as any).appRole.create({
      data: {
        name: data.name,
        permissions: data.permissions,
        organizationId: orgId,
      }
    });

    revalidatePath('/dashboard/settings/roles');
    return { success: true, data: newRole };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateRole(id: string, data: { name: string; permissions: string[] }) {
  try {
    const { orgId } = await getSessionContext();
    
    if (!await checkPermission('settings:roles')) {
      return { success: false, error: 'Permission denied' };
    }

    const updatedRole = await (prisma as any).appRole.update({
      where: { id, organizationId: orgId },
      data: {
        name: data.name,
        permissions: data.permissions,
      }
    });

    revalidatePath('/dashboard/settings/roles');
    return { success: true, data: updatedRole };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRole(id: string) {
  try {
    const { orgId } = await getSessionContext();
    
    if (!await checkPermission('settings:roles')) {
      return { success: false, error: 'Permission denied' };
    }

    // Check if role is in use
    const userCount = await prisma.user.count({
      where: { roleId: id } as any
    });

    if (userCount > 0) {
      return { success: false, error: 'Cannot delete role that is assigned to users' };
    }

    await (prisma as any).appRole.delete({
      where: { id, organizationId: orgId }
    });

    revalidatePath('/dashboard/settings/roles');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
