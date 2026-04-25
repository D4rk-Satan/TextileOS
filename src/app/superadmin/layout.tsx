'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  TrendingUp, 
  Settings
} from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
    { name: 'Organizations', href: '/superadmin/organizations', icon: Building2 },
    { name: 'All Users', href: '/superadmin/users', icon: Users },
    { name: 'Analytics', href: '/superadmin/analytics', icon: TrendingUp },
    { name: 'Settings', href: '/superadmin/settings', icon: Settings },
  ];

  const userProfile = {
    name: 'TextileOS Admin',
    role: 'Super Admin',
    initials: 'SA',
    orgName: 'System Management'
  };

  return (
    <DashboardShell navigation={navigation} userProfile={userProfile}>
      {children}
    </DashboardShell>
  );
}
