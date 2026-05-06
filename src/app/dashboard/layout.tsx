export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { getOrgBranding } from '@/app/actions/superadmin';
import { verifySession } from '@/lib/dal';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch data on the server
  const session = await verifySession();
  const branding = await getOrgBranding();
  
  // Default to 'User' role for safety if session is missing or invalid
  const userRole = session?.role || 'User';
  
  const profile = {
    name: branding.success && branding.org ? branding.org.name : 'User',
    role: userRole,
    initials: branding.success && branding.org ? branding.org.name.substring(0, 2).toUpperCase() : '..',
    orgName: branding.success && branding.org ? branding.org.name : 'TextileOS'
  };

  return (
    <Suspense fallback={null}>
      <DashboardShell userProfile={profile}>
        {children}
      </DashboardShell>
    </Suspense>
  );
}
