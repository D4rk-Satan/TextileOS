'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { checkPermission } from '@/lib/dal';

async function getSessionContext() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('org_id')?.value;
  if (!orgId) throw new Error('Organization not found in session');
  return { orgId };
}

export async function getRoles() {
  try {
    const { orgId } = await getSessionContext();
    
    const roles = await (prisma as any).appRole.findMany({
      where: { organizationId: orgId },
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, data: roles };
  } catch (error: any) {
    console.error('getRoles Error:', error);
    return { success: false, error: error.message };
  }
}

export async function createRole(data: { name: string, permissions: string[] }) {
  try {
    if (!await checkPermission('settings:roles')) {
      return { success: false, error: 'Permission denied' };
    }

    const { orgId } = await getSessionContext();
    
    const role = await (prisma as any).appRole.create({
      data: {
        name: data.name,
        permissions: data.permissions,
        organizationId: orgId
      } as any
    });
    
    revalidatePath('/dashboard/settings/roles');
    return { success: true, data: role };
  } catch (error: any) {
    console.error('createRole Error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateRole(id: string, data: { name: string, permissions: string[] }) {
  try {
    if (!await checkPermission('settings:roles')) {
      return { success: false, error: 'Permission denied' };
    }

    const role = await (prisma as any).appRole.update({
      where: { id },
      data: {
        name: data.name,
        permissions: data.permissions
      } as any
    });
    
    revalidatePath('/dashboard/settings/roles');
    return { success: true, data: role };
  } catch (error: any) {
    console.error('updateRole Error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteRole(id: string) {
  try {
    if (!await checkPermission('settings:roles')) {
      return { success: false, error: 'Permission denied' };
    }

    // Check if role is in use
    const userWithRole = await prisma.user.findFirst({
      where: { roleId: id } as any
    });

    if (userWithRole) {
      return { success: false, error: 'Cannot delete role as it is currently assigned to users' };
    }

    await (prisma as any).appRole.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/settings/roles');
    return { success: true };
  } catch (error: any) {
    console.error('deleteRole Error:', error);
    return { success: false, error: error.message };
  }
}
