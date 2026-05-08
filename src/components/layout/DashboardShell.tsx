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
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const [isHeaderEmpty, setIsHeaderEmpty] = React.useState(true);
  const headerPortalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    
    const checkPortal = () => {
      if (headerPortalRef.current) {
        // We check for both element children and text content to be safe
        const hasContent = headerPortalRef.current.children.length > 0 || 
                           headerPortalRef.current.textContent?.trim().length! > 0;
        setIsHeaderEmpty(!hasContent);
      }
    };

    // Initial check
    checkPortal();
    
    const observer = new MutationObserver(checkPortal);

    if (headerPortalRef.current) {
      observer.observe(headerPortalRef.current, { 
        childList: true, 
        subtree: true,
        characterData: true 
      });
    }

    // Also check on a slight delay because Portals can be asynchronous
    const timer = setTimeout(checkPortal, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

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
            <NavLink 
              key={item.name} 
              item={item} 
              isMinimized={isMinimized} 
              isOpen={openDropdown === item.name}
              onToggle={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
            />
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
        <header className="sticky top-0 h-20 border-b border-border bg-background/60 backdrop-blur-xl z-40 px-10 flex items-center gap-8 transition-all duration-300">
          <div className="flex-1 flex items-center relative h-full">
             {/* Portal Target - Takes priority */}
             <div 
               id="page-header-portal" 
               ref={headerPortalRef} 
               className="w-full flex items-center justify-between"
             />

             {/* Default Header Content - Only shown if portal is empty */}
             {isHeaderEmpty && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="absolute inset-0 flex items-center justify-between pointer-events-none"
               >
                 <div className="flex items-center gap-6 pointer-events-auto">
                    <Menu size={20} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                          <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                          <ChevronRight size={12} className="opacity-30" />
                          <span className="text-foreground/80">{pathname.split('/').pop()?.replace(/-/g, ' ')}</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex-1 max-w-md mx-auto pointer-events-auto">
                   <div className="group flex items-center gap-3 px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-2xl text-muted-foreground transition-all border border-border/50 hover:border-primary/20 cursor-pointer shadow-sm">
                      <Search size={16} className="group-hover:text-primary transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Quick search modules..." 
                        className="bg-transparent border-none outline-none text-xs font-bold w-full placeholder:text-muted-foreground/40"
                      />
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-black border border-border px-1.5 py-0.5 rounded-md bg-background">⌘</span>
                        <span className="text-[9px] font-black border border-border px-1.5 py-0.5 rounded-md bg-background">K</span>
                      </div>
                   </div>
                 </div>

                 <div className="flex items-center gap-6 min-w-[120px] justify-end pointer-events-auto">
                    <button className="relative p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95">
                       <Bell size={20} />
                       <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse"></span>
                    </button>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg shadow-primary/20 cursor-pointer hover:scale-110 active:scale-90 transition-all">
                       {userProfile.initials}
                    </div>
                 </div>
               </motion.div>
             )}

             {/* Always show Profile/Theme if portal is used but doesn't provide them */}
             {!isHeaderEmpty && (
               <div className="flex items-center gap-4 pl-6 border-l border-border/50 ml-6">
                 <ThemeToggle />
                 <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-foreground font-black text-xs border border-border shadow-sm">
                    {userProfile.initials}
                 </div>
               </div>
             )}
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

function NavLink({ 
  item, 
  isMinimized, 
  isOpen, 
  onToggle 
}: { 
  item: NavItem, 
  isMinimized: boolean, 
  isOpen?: boolean, 
  onToggle?: () => void 
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const fullPath = searchParams.toString() 
    ? `${item.href}?${searchParams.toString()}`
    : item.href;
    
  const isActive = pathname === item.href || (item.isDropdown && pathname.startsWith(item.href));

  if (item.isDropdown && item.subItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={onToggle}
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
