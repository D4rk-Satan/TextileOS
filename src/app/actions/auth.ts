'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 4. Create Admin User for this Org
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'Admin',
        organizationId: organization.id,
      },
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
    cookieStore.set('user_role', user.role, { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    cookieStore.set('org_id', user.organizationId || '', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production' });

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
  return { success: true };
}
