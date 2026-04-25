'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  Search,
  UserCircle,
  Menu,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  isDropdown?: boolean;
  subItems?: NavItem[];
}

interface DashboardShellProps {
  children: React.ReactNode;
  navigation: NavItem[];
  userProfile?: {
    name: string;
    role: string;
    initials: string;
    orgName?: string;
  };
}

export default function DashboardShell({
  children,
  navigation,
  userProfile = {
    name: 'User',
    role: 'Member',
    initials: 'U',
    orgName: 'TextileOS'
  }
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

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

  const toggleExpanded = (name: string) => {
    if (isMinimized) return;
    setExpandedItems(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const NavLink = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    const isExpanded = expandedItems.includes(item.name);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    if (item.isDropdown) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium transition-all group outline-none relative overflow-hidden',
              isActive && depth === 0
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : isActive && depth > 0
                ? 'text-blue-600 bg-blue-50/50'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              depth > 0 && 'py-2 px-3 text-xs'
            )}
          >
            {item.icon && (
              <item.icon size={depth === 0 ? 20 : 16} className={cn(
                'flex-shrink-0 transition-colors',
                isActive && depth === 0 ? 'text-white' : isActive ? 'text-blue-600' : 'text-muted-foreground group-hover:text-foreground'
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
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group outline-none overflow-hidden',
          isActive && depth === 0
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
            : isActive && depth > 0
            ? 'text-blue-600 bg-blue-50/50'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          depth > 0 && 'py-2 px-3 text-xs'
        )}
      >
        {item.icon && (
          <item.icon size={depth === 0 ? 20 : 16} className={cn(
            'flex-shrink-0 transition-colors',
            isActive && depth === 0 ? 'text-white' : isActive ? 'text-blue-600' : 'text-muted-foreground group-hover:text-foreground'
          )} />
        )}
        <span className={cn("transition-all duration-300 whitespace-nowrap", isMinimized ? "opacity-0 w-0 translate-x-4" : "opacity-100 w-auto translate-x-0")}>
          {item.name}
        </span>
        {!isMinimized && isActive && (
          <ChevronRight size={14} className="ml-auto" />
        )}
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
        <div className="p-6 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 h-20">
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", isMinimized ? "w-0 opacity-0" : "w-auto opacity-100")}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-lg text-white">T</div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap">TextileOS</span>
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block whitespace-nowrap">{userProfile.orgName}</span>
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
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all group overflow-hidden">
            <UserCircle size={20} className="flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
            <span className={cn("transition-all duration-300 whitespace-nowrap", isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto")}>
              Profile Settings
            </span>
          </button>
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
        <header className="h-20 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 flex items-center justify-between px-8 transition-colors duration-300">
          <div className="flex items-center gap-4 flex-1">
            <button className="p-2 lg:hidden text-foreground">
              <Menu size={20} />
            </button>
            <div className="relative w-96 hidden md:block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full bg-muted border-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-foreground focus:ring-2 focus:ring-blue-600/20 border transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
            </button>
          </div>
            <div className="h-10 w-px bg-border"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground leading-none">{userProfile.name}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">{userProfile.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                {userProfile.initials}
              </div>
            </div>
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
