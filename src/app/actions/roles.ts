'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/permissions';

async function getSessionContext() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('org_id')?.value;
  const role = cookieStore.get('user_role')?.value;
  
  if (!orgId || !role) throw new Error('Unauthorized: Missing session context');
  return { orgId, role };
}

export async function getRoles() {
  try {
    const { orgId } = await getSessionContext();
    const roles = await prisma.appRole.findMany({
      where: { organizationId: orgId },
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return { success: true, data: roles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createRole(data: { name: string; permissions: string[] }) {
  try {
    const { orgId, role } = await getSessionContext();
    
    // Only Admin (Legacy) can manage roles for now
    if (role !== 'Admin') {
      return { success: false, error: 'Permission denied: Only administrators can manage roles' };
    }

    const newRole = await prisma.appRole.create({
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
    const { orgId, role } = await getSessionContext();
    
    if (role !== 'Admin') {
      return { success: false, error: 'Permission denied' };
    }

    const updatedRole = await prisma.appRole.update({
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
    const { orgId, role } = await getSessionContext();
    
    if (role !== 'Admin') {
      return { success: false, error: 'Permission denied' };
    }

    // Check if role is in use
    const userCount = await prisma.user.count({
      where: { roleId: id }
    });

    if (userCount > 0) {
      return { success: false, error: 'Cannot delete role that is assigned to users' };
    }

    await prisma.appRole.delete({
      where: { id, organizationId: orgId }
    });

    revalidatePath('/dashboard/settings/roles');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
