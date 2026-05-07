import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from './prisma';
import { Permission, hasPermission, ALL_PERMISSIONS } from './permissions';

export async function verifySession() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;
  const orgId = cookieStore.get('org_id')?.value;
  const email = cookieStore.get('user_email')?.value;
  const roleId = cookieStore.get('role_id')?.value;

  if (!role || !orgId) {
    return null;
  }

  return { role, orgId, email, roleId };
}

export async function getUserPermissions() {
  const session = await verifySession();
  if (!session) return [];

  // SuperAdmin has all permissions
  if (session.role === 'SuperAdmin') {
    return ALL_PERMISSIONS;
  }

  // Admin (Legacy) also gets everything by default if no roleId is set
  if (session.role === 'Admin' && !session.roleId) {
    return ALL_PERMISSIONS;
  }

  if (!session.roleId) return [];

  try {
    const role = await (prisma as any).appRole.findUnique({
      where: { id: session.roleId },
      select: { permissions: true }
    });
    return role?.permissions || [];
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }
}

export async function getUserRole() {
  const session = await verifySession();
  return session?.role || null;
}

export async function getOrganizationId() {
  const session = await verifySession();
  return session?.orgId || null;
}

/**
 * Guard for server actions and pages
 */
export async function protectRoute(allowedRoles: string[]) {
  const session = await verifySession();
  
  if (!session) {
    redirect('/login');
  }

  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard');
  }

  return session;
}

export async function checkPermission(permission: Permission): Promise<boolean> {
  const permissions = await getUserPermissions();
  return hasPermission(permissions, permission);
}

export async function protectWithPermission(permission: Permission) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const permissions = await getUserPermissions();
  if (!hasPermission(permissions, permission)) {
    redirect('/dashboard');
  }

  return session;
}
