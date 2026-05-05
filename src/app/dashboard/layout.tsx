'use client';

import React, { Suspense } from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  FileText, 
  Settings, 
  Users,
  Building2,
  Warehouse,
  Package,
  Printer,
  ShoppingCart,
  Truck,
  RotateCcw,
  Droplets,
  Layers,
  Waves,
  FilePlus
} from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { getOrgBranding } from '@/app/actions/superadmin';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = React.useState({
    name: 'User',
    role: 'Administrator',
    initials: '..',
    orgName: 'TextileOS'
  });

  React.useEffect(() => {
    async function fetchBranding() {
      const result = await getOrgBranding();
      if (result.success && result.org) {
        setProfile({
          name: result.org.name,
          role: 'Administrator',
          initials: result.org.name.substring(0, 2).toUpperCase(),
          orgName: result.org.name
        });
      }
    }
    fetchBranding();
  }, []);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { 
      name: 'Master', 
      href: '/dashboard/master', 
      icon: Boxes,
      isDropdown: true,
        subItems: [
          { name: 'Customers', href: '/dashboard/master?tab=customers', icon: Users },
          { name: 'Vendors', href: '/dashboard/master?tab=vendors', icon: Building2 },
          { name: 'Items', href: '/dashboard/master?tab=items', icon: Package },
        ]
    },
    { 
      name: 'Batches', 
      href: '/dashboard/warehouse', 
      icon: Warehouse,
      isDropdown: true,
      subItems: [
        { name: 'Grey Inward', href: '/dashboard/warehouse?tab=grey-inward', icon: Building2 },
        { name: 'In-Warehouse', href: '/dashboard/warehouse?tab=batches', icon: Boxes },
        { name: 'Out For RFD', href: '/dashboard/warehouse?tab=out-for-rfd', icon: RotateCcw },
        { name: 'Ready For Printing', href: '/dashboard/warehouse?tab=ready-for-printing', icon: Printer },
        { name: 'Under Printing', href: '/dashboard/warehouse?tab=under-printing', icon: Printer },
        { name: 'Ready For Dispatch', href: '/dashboard/warehouse?tab=ready-for-dispatch', icon: ShoppingCart },
        { name: 'Dispatched', href: '/dashboard/warehouse?tab=dispatched', icon: Truck },
      ]
    },
    { 
      name: 'Dyeing House', 
      href: '/dashboard/dyeing-house', 
      icon: Waves,
      isDropdown: true,
      subItems: [
        { name: 'Grey Outward', href: '/dashboard/dyeing-house?tab=grey-outward', icon: Droplets },
        { name: 'RFD Inward', href: '/dashboard/dyeing-house?tab=rfd-inward', icon: Layers },
      ]
    },
    { 
      name: 'Printing Process', 
      href: '/dashboard/printing-process', 
      icon: Printer,
      isDropdown: true,
      subItems: [
        { name: 'Issue For Printing', href: '/dashboard/printing-process?tab=issue', icon: FileText },
        { name: 'Receive From Printing', href: '/dashboard/printing-process?tab=receive', icon: RotateCcw },
      ]
    },
    { 
      name: 'Delivery Challan', 
      href: '/dashboard/delivery-challan', 
      icon: Truck,
      isDropdown: true,
      subItems: [
        { name: 'Send to Dispatch', href: '/dashboard/delivery-challan?tab=send-to-dispatch', icon: FilePlus },
      ]
    },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <Suspense fallback={null}>
      <DashboardShell navigation={navigation} userProfile={profile}>
        {children}
      </DashboardShell>
    </Suspense>
  );
}
