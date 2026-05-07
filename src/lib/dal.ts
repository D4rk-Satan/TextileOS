import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from './prisma';
import { Permission, ALL_PERMISSIONS } from './permissions';

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

export async function getUserRole() {
  const session = await verifySession();
  return session?.role || null;
}

export async function getOrganizationId() {
  const session = await verifySession();
  return session?.orgId || null;
}

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

// Temporary placeholders during RBAC rebuild
export async function getUserPermissions(): Promise<string[]> {
  const session = await verifySession();
  if (!session) return [];

  // SuperAdmin has all permissions
  if (session.role === 'SuperAdmin') {
    return [...ALL_PERMISSIONS];
  }

  // Admin (Legacy) also gets everything by default if no roleId is set
  if (session.role === 'Admin' && !(session as any).roleId) {
    return [...ALL_PERMISSIONS];
  }

  const roleId = (session as any).roleId;
  if (!roleId) return [];

  try {
    const role = await (prisma as any).appRole.findUnique({
      where: { id: roleId },
      select: { permissions: true }
    });
    return role?.permissions || [];
  } catch (error) {
    console.error('DAL Permissions Error:', error);
    return [];
  }
}

export async function checkPermission(permission: string): Promise<boolean> {
  const permissions = await getUserPermissions();
  const session = await verifySession();
  
  // SuperAdmin/Admin bypass
  if (session?.role === 'SuperAdmin' || (session?.role === 'Admin' && !(session as any).roleId)) {
    return true;
  }

  return permissions.includes(permission);
}

export async function protectWithPermission(permission: string) {
  const hasAccess = await checkPermission(permission);
  if (!hasAccess) {
    redirect('/dashboard');
  }
}
