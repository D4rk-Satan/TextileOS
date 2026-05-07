'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { checkPermission } from '@/lib/dal';

export async function registerOrganization(data: any) {
  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // 2. Create Organization
    const organization = await prisma.organization.create({
      data: {
        name: data.organizationName,
        email: data.email,
        phone: data.phone,
        status: 'Active',
      },
    });

    // 3. Create Default Admin Role
    const { ALL_PERMISSIONS } = await import('@/lib/permissions');
    const adminRole = await (prisma as any).appRole.create({
      data: {
        name: 'Administrator',
        permissions: ALL_PERMISSIONS,
        organizationId: organization.id,
      }
    });

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 5. Create Admin User for this Org
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'Admin',
        roleId: adminRole.id,
      } as any,
    });

    return { success: true, organization, user };
  } catch (error: any) {
    console.error('Registration Error:', error);
    return { success: false, error: error.message };
  }
}

export async function loginUser(data: any) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { organization: true },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Set Cookies for Session
    const cookieStore = await cookies();
    const cookieOptions = { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production' };
    
    cookieStore.set('user_role', user.role, cookieOptions);
    cookieStore.set('org_id', user.organizationId || '', cookieOptions);
    cookieStore.set('user_email', user.email, cookieOptions);
    if ((user as any).roleId) {
      cookieStore.set('role_id', (user as any).roleId, cookieOptions);
    }

    // In a real app, you would set a session/cookie here
    return { 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        organization: user.organization 
      } 
    };
  } catch (error: any) {
    console.error('Login Error:', error);
    return { success: false, error: error.message };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('user_role');
  cookieStore.delete('org_id');
  cookieStore.delete('user_email');
  cookieStore.delete('role_id');
  return { success: true };
}

export async function createStaffUser(data: any) {
  try {
    const cookieStore = await cookies();
    const orgId = cookieStore.get('org_id')?.value;
    
    if (!await checkPermission('settings:team')) {
      return { success: false, error: 'Permission denied' };
    }

    if (!orgId) {
      return { success: false, error: 'Organization context missing' };
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Create Staff User
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'User',
        roleId: data.roleId || null,
        organizationId: orgId,
      } as any,
    });

    revalidatePath('/dashboard/settings/team');
    return { success: true, user };
  } catch (error: any) {
    console.error('Create Staff Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getOrganizationUsers() {
  try {
    const cookieStore = await cookies();
    const orgId = cookieStore.get('org_id')?.value;

    if (!orgId) return { success: false, users: [] };

    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        email: true,
        role: true,
        roleId: true,
        dynamicRole: {
          select: {
            name: true
          }
        },
        createdAt: true,
      } as any
    });

    return { success: true, users };
  } catch (error) {
    return { success: false, users: [] };
  }
}

export async function getUserRole() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;
  return role || 'User';
}
