'use server';

import prisma from '@/lib/prisma';

import { cookies } from 'next/headers';

export async function getOrgBranding() {
  try {
    const cookieStore = await cookies();
    const orgId = cookieStore.get('org_id')?.value;

    if (!orgId) {
      return { success: false, error: 'No organization ID found in session' };
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    
    if (!org) {
      return { success: false, error: 'Organization not found' };
    }

    return { success: true, org };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllOrganizations() {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          take: 1,
          where: { role: 'Admin' }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: organizations };
  } catch (error: any) {
    console.error('Fetch Orgs Error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrganizationStatus(id: string, status: string) {
  try {
    const organization = await prisma.organization.update({
      where: { id },
      data: { status }
    });
    return { success: true, data: organization };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
