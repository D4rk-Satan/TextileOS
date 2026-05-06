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
  LogOut
} from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

// Move default navigation here to avoid passing functions from Server Components
const DEFAULT_ORG_NAVIGATION: NavItem[] = [
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
    name: 'Grey', 
    href: '/dashboard/grey', 
    icon: Layers,
    isDropdown: true,
    subItems: [
      { name: 'Grey Inward', href: '/dashboard/grey?tab=grey-inward', icon: Building2 },
    ]
  },
  { 
    name: 'Batches', 
    href: '/dashboard/warehouse', 
    icon: Warehouse,
    isDropdown: true,
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
    subItems: [
      { name: 'Delivery Challan', href: '/dashboard/delivery-challan?tab=delivery-challan', icon: FilePlus },
    ]
  },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    isDropdown: true,
    subItems: [
      { name: 'General', href: '/dashboard/settings', icon: Settings },
      { name: 'Organization Team', href: '/dashboard/settings/team', icon: Users },
    ]
  },
];

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  isDropdown?: boolean;
  subItems?: NavItem[];
}

interface DashboardShellProps {
  children: React.ReactNode;
  navigation?: NavItem[];
  userProfile?: {
    name: string;
    role: string;
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
    initials: 'U',
    orgName: 'TextileOS'
  }
}: DashboardShellProps) {
  const router = useRouter();
  const navigation = providedNavigation || DEFAULT_ORG_NAVIGATION;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
    router.refresh();
  };

  React.useEffect(() => {
    setMounted(true);
    // Initialize expanded items after mount to prevent hydration mismatch
    const initialExpanded: string[] = [];
    const findExpanded = (items: NavItem[]) => {
      items.forEach(item => {
        if (item.isDropdown && pathname.startsWith(item.href)) {
          initialExpanded.push(item.name);
          if (item.subItems) findExpanded(item.subItems);
        }
      });
    };
    findExpanded(navigation);
    setExpandedItems(initialExpanded);
  }, [pathname, navigation]);

  const toggleExpanded = (name: string, depth: number) => {
    if (isMinimized) return;
    setExpandedItems(prev => {
      const isCurrentlyExpanded = prev.includes(name);
      
      if (depth === 0) {
        // For top-level items, only allow one to be open at a time
        return isCurrentlyExpanded ? [] : [name];
      }
      
      // For nested items, toggle normally
      return isCurrentlyExpanded 
        ? prev.filter(i => i !== name) 
        : [...prev, name];
    });
  };

  const NavLink = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const isActive = item.href.includes('?') 
      ? currentFullUrl === item.href 
      : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    const isExpanded = expandedItems.includes(item.name);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    if (item.isDropdown) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.name, depth)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[13px] font-medium transition-all group outline-none relative overflow-hidden',
              isActive && depth === 0
                ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold' 
                : isActive && depth > 0
                ? 'text-primary bg-primary/10 border-l-4 border-primary rounded-none rounded-r-xl font-bold translate-x-1'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              depth > 0 && 'py-2 px-3 text-[11px]'
            )}
          >
            {item.icon && (
              <item.icon size={depth === 0 ? 20 : 16} className={cn(
                'flex-shrink-0 transition-colors',
                isActive && depth === 0 ? 'text-white' : isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
            )}
            <span className={cn("transition-all duration-300 whitespace-nowrap", isMinimized ? "opacity-0 w-0 translate-x-4" : "opacity-100 w-auto translate-x-0")}>
              {item.name}
            </span>
            {!isMinimized && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-auto"
              >
                <ChevronRight size={14} />
              </motion.div>
            )}
          </button>
          
          <AnimatePresence>
            {isExpanded && !isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={cn(
                  "mt-1 space-y-1",
                  depth === 0 ? "ml-4 pl-4 border-l-2 border-border" : "ml-6 pl-4 border-l border-border/50"
                )}>
                  {item.subItems?.map((subItem) => (
                    <NavLink key={subItem.name} item={subItem} depth={depth + 1} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={() => depth === 0 && setExpandedItems([])}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all group outline-none overflow-hidden',
          isActive && depth === 0
            ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold' 
            : isActive && depth > 0
            ? 'text-primary bg-primary/10 border-l-4 border-primary rounded-none rounded-r-xl font-bold translate-x-1'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          depth > 0 && 'py-2 px-3 text-[11px]'
        )}
      >
        {item.icon && (
          <item.icon size={depth === 0 ? 20 : 16} className={cn(
            'flex-shrink-0 transition-colors',
            isActive && depth === 0 ? 'text-white' : isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )} />
        )}
        <span className={cn("transition-all duration-300 whitespace-nowrap", isMinimized ? "opacity-0 w-0 translate-x-4" : "opacity-100 w-auto translate-x-0")}>
          {item.name}
        </span>
      </Link>
    );
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-card border-r border-border flex flex-col fixed h-full z-50 shadow-sm transition-all duration-300 ease-in-out overflow-x-hidden no-scrollbar",
          isMinimized ? "w-20" : "w-64"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 h-16">
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", isMinimized ? "w-0 opacity-0" : "w-auto opacity-100")}>
            <div className="w-8 h-8 bg-primary rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-lg text-white">T</div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground whitespace-nowrap">TextileOS</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest block whitespace-nowrap">{userProfile.orgName}</span>
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
              const role = userProfile.role?.toLowerCase();
              
              // RBAC Logic: Standard users (non-admin) cannot see Settings
              if (role !== 'admin' && item.name === 'Settings') {
                return false;
              }
              return true;
            })
            .map((item) => (
              <NavLink key={item.name} item={item} />
            ))
          }
        </nav>

        <div className="p-4 border-t border-border bg-card/50 mt-auto">
          <div className={cn(
            "flex transition-all duration-300",
            isMinimized ? "flex-col items-center gap-4" : "items-center justify-between"
          )}>
            <div className={cn("flex flex-col", isMinimized && "hidden")}>
               <span className="text-[10px] text-primary font-bold uppercase tracking-widest">{userProfile.orgName}</span>
               <span className="text-xs font-bold text-foreground">Organization</span>
            </div>
            
            <div className={cn("flex items-center gap-2", isMinimized && "flex-col")}>
              <ThemeToggle />
              <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-card"></span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          isMinimized ? "pl-20" : "pl-64"
        )}
      >
        {/* Header */}
        <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 flex items-center justify-between px-8 transition-colors duration-300">
          <div className="flex items-center gap-8 flex-1">
            <button className="p-2 lg:hidden text-foreground">
              <Menu size={20} />
            </button>
            
            {/* Portal target for page-specific title and actions */}
            <div id="page-header-portal" className="flex-1 flex items-center gap-6" />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10 font-bold transition-all text-xs border border-transparent hover:border-red-500/20 shadow-sm"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
