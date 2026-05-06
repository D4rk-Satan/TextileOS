import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function verifySession() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;
  const orgId = cookieStore.get('org_id')?.value;

  if (!role || !orgId) {
    return null;
  }

  return { role, orgId };
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
    redirect('/dashboard'); // or a 403 page
  }

  return session;
}
