export const dynamic = 'force-dynamic';
import React from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { verifySession, getUserPermissions } from '@/lib/dal';
import { getOrgBranding } from '@/app/actions/superadmin';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  if (!session) {
    redirect('/login');
  }

  const permissions = await getUserPermissions();
  const branding = await getOrgBranding();
  
  const userRole = session?.role || 'User';
  
  const profile = {
    name: branding?.org?.name || 'User',
    role: userRole,
    userEmail: session?.email || '',
    initials: branding?.org?.name?.substring(0, 2).toUpperCase() || '..',
    orgName: branding?.org?.name || 'TextileOS',
    permissions: permissions
  };

  return (
    <DashboardShell userProfile={profile as any}>
      {children}
    </DashboardShell>
  );
}
