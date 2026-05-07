'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { 
  Bell, 
  Search,
  UserCircle,
  Menu,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
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
  FilePlus,
  Shield,
  LogOut
} from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  isDropdown?: boolean;
  subItems?: NavItem[];
  permission?: string;
}

const DEFAULT_ORG_NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Master', 
    href: '/dashboard/master', 
    icon: Boxes,
    isDropdown: true,
    permission: 'module:master',
    subItems: [
      { name: 'Customers', href: '/dashboard/master?tab=customers', icon: Users },
      { name: 'Vendors', href: '/dashboard/master?tab=vendors', icon: Building2 },
      { name: 'Items', href: '/dashboard/master?tab=items', icon: Package },
    ]
  },
  { 
    name: 'Grey', 
    href: '/dashboard/grey', 
    icon: Layers,
    isDropdown: true,
    permission: 'module:grey',
    subItems: [
      { name: 'Grey Inward', href: '/dashboard/grey?tab=grey-inward', icon: Building2 },
    ]
  },
  { 
    name: 'Batches', 
    href: '/dashboard/warehouse', 
    icon: Warehouse,
    isDropdown: true,
    permission: 'module:warehouse',
    subItems: [
      { name: 'In-Warehouse', href: '/dashboard/warehouse?tab=batches', icon: Boxes },
      { name: 'Out For RFD', href: '/dashboard/warehouse?tab=out-for-rfd', icon: RotateCcw },
      { name: 'Ready For Printing', href: '/dashboard/warehouse?tab=ready-for-printing', icon: Printer },
      { name: 'Under Printing', href: '/dashboard/warehouse?tab=under-printing', icon: Printer },
      { name: 'Ready For Dispatch', href: '/dashboard/warehouse?tab=ready-for-dispatch', icon: ShoppingCart },
      { name: 'Dispatched', href: '/dashboard/warehouse?tab=dispatched', icon: Truck },
    ]
  },
  { 
    name: 'RFD Process', 
    href: '/dashboard/dyeing-house', 
    icon: Waves,
    isDropdown: true,
    permission: 'module:rfd',
    subItems: [
      { name: 'Issue for RFD', href: '/dashboard/dyeing-house?tab=grey-outward', icon: Droplets },
      { name: 'Receive from RFD', href: '/dashboard/dyeing-house?tab=rfd-inward', icon: Layers },
    ]
  },
  { 
    name: 'Printing Process', 
    href: '/dashboard/printing-process', 
    icon: Printer,
    isDropdown: true,
    permission: 'module:printing',
    subItems: [
      { name: 'Issue For Printing', href: '/dashboard/printing-process?tab=issue', icon: FileText },
      { name: 'Receive From Printing', href: '/dashboard/printing-process?tab=receive', icon: RotateCcw },
    ]
  },
  { 
    name: 'Dispatch', 
    href: '/dashboard/delivery-challan', 
    icon: Truck,
    isDropdown: true,
    permission: 'module:dispatch',
    subItems: [
      { name: 'Delivery Challan', href: '/dashboard/delivery-challan?tab=delivery-challan', icon: FilePlus },
    ]
  },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText, permission: 'module:reports' },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    isDropdown: true,
    subItems: [
      { name: 'Roles & Permissions', href: '/dashboard/settings/roles', icon: Shield, permission: 'settings:roles' },
      { name: 'Organization Team', href: '/dashboard/settings/team', icon: Users, permission: 'settings:team' },
    ]
  },
];

interface DashboardShellProps {
  children: React.ReactNode;
  navigation?: NavItem[];
  userProfile?: {
    name: string;
    role: string;
    userEmail?: string;
    initials: string;
    orgName?: string;
  };
}

export default function DashboardShell({
  children,
  navigation: providedNavigation,
  userProfile = {
    name: 'User',
    role: 'Member',
    userEmail: 'user@textileos.com',
    initials: 'U',
    orgName: 'TextileOS',
  }
}: DashboardShellProps) {
  const router = useRouter();
  const navigation = providedNavigation || DEFAULT_ORG_NAVIGATION;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isMinimized ? '80px' : '280px' }}
        className="fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-50 transition-all duration-300 ease-in-out"
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className={cn("flex items-center gap-3", isMinimized && "hidden")}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-xl">T</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter text-foreground uppercase">TextileOS</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Enterprise</span>
            </div>
          </div>
          
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={cn(
              "p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300",
              isMinimized ? "mx-auto ring-1 ring-border" : "ml-2"
            )}
            title={isMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
          >
            {isMinimized ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar">
          {navigation
            .filter(item => {
              const role = userProfile?.role?.toLowerCase();
              const userPermissions = (userProfile as any)?.permissions || [];
              
              // RBAC Logic: 
              // 1. SuperAdmin sees everything
              if (role === 'superadmin' || role === 'super admin') return true;
              
              // 2. Filter item by its permission requirement
              if ((item as any).permission && !userPermissions.includes((item as any).permission)) {
                return false;
              }

              // 3. For dropdowns, filter sub-items and hide if all sub-items are filtered out
              if (item.subItems) {
                const visibleSubItems = item.subItems.filter(sub => 
                  !(sub as any).permission || userPermissions.includes((sub as any).permission)
                );
                
                // Special case for Settings: if user is legacy Admin, they see it
                if (item.name === 'Settings' && role === 'admin') return true;
                
                return visibleSubItems.length > 0;
              }

              // Legacy check for Settings if no permissions system is yet active for the user
              if (role !== 'admin' && item.name === 'Settings') {
                return false;
              }
              
              return true;
            })
            .map((item) => (
            <NavLink key={item.name} item={item} isMinimized={isMinimized} />
          ))}
        </nav>

        {/* User Info & Profile */}
        <div className="p-4 border-t border-border bg-card/50 mt-auto">
          <div className={cn(
            "flex transition-all duration-300",
            isMinimized ? "flex-col items-center gap-4" : "items-center justify-between"
          )}>
            <div className={cn("flex flex-col overflow-hidden", isMinimized && "hidden")}>
               <span className="text-xs font-bold text-foreground truncate max-w-[140px]">{userProfile.userEmail}</span>
               <span className="text-[10px] text-primary font-bold uppercase tracking-widest truncate">{userProfile.orgName}</span>
            </div>
            
            <div className={cn("flex items-center gap-2", isMinimized && "flex-col")}>
              <ThemeToggle />
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isMinimized ? "pl-[80px]" : "pl-[280px]"
      )}>
        {/* Top Navbar */}
        <header className="sticky top-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-40 px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-muted-foreground min-w-[200px]">
             <Menu size={20} className="lg:hidden" />
             <div className="flex items-center gap-2 text-xs font-medium">
                <span>Dashboard</span>
                <ChevronRight size={14} />
                <span className="text-foreground font-bold">{pathname.split('/').pop()?.replace(/-/g, ' ')}</span>
             </div>
          </div>

          <div className="flex-1 max-w-md mx-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border">
               <Search size={16} />
               <input 
                 type="text" 
                 placeholder="Search modules..." 
                 className="bg-transparent border-none outline-none text-xs font-medium w-full placeholder:text-muted-foreground/50"
               />
               <span className="ml-4 text-[10px] opacity-50 font-bold border border-border px-1.5 py-0.5 rounded">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-6 min-w-[200px] justify-end">
            <div className="flex items-center gap-3">
               <button className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
               </button>
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-background ring-offset-2 ring-offset-border cursor-pointer">
                  {userProfile.initials}
               </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ item, isMinimized }: { item: NavItem, isMinimized: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const fullPath = searchParams.toString() 
    ? `${item.href}?${searchParams.toString()}`
    : item.href;
    
  const isActive = pathname === item.href || (item.isDropdown && pathname.startsWith(item.href));

  if (item.isDropdown && item.subItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            isMinimized && "justify-center"
          )}
        >
          <item.icon size={20} className={cn(
            "transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )} />
          {!isMinimized && (
            <>
              <span className="ml-3 flex-1 text-left">{item.name}</span>
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={16} className="opacity-50" />
              </motion.div>
            </>
          )}
        </button>
        
        <AnimatePresence>
          {isOpen && !isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pl-11 space-y-1"
            >
              {item.subItems.map((sub) => (
                <Link
                  key={sub.name}
                  href={sub.href}
                  className={cn(
                    "block px-3 py-2 rounded-md text-xs font-medium transition-colors",
                    pathname + (searchParams.toString() ? '?' + searchParams.toString() : '') === sub.href
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {sub.name}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
        isActive ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isMinimized && "justify-center"
      )}
    >
      <item.icon size={20} className={cn(
        "transition-colors",
        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )} />
      {!isMinimized && <span className="ml-3">{item.name}</span>}
      {isActive && !isMinimized && (
        <motion.div 
          layoutId="active-indicator"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" 
        />
      )}
    </Link>
  );
}
