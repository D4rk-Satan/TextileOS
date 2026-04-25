'use client';

import React from 'react';
import { 
  UserCheck, 
  Building2, 
  Clock4, 
  IndianRupee,
  ArrowUpRight,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDashboardStats } from '@/app/actions/master';

export default function DashboardPage() {
  const [statsData, setStatsData] = React.useState({ customers: 0, vendors: 0, items: 0 });

  React.useEffect(() => {
    async function fetchStats() {
      const result = await getDashboardStats();
      if (result?.success) {
        setStatsData(result.stats || { customers: 0, vendors: 0, items: 0 });
      }
    }
    fetchStats();
  }, []);

  const stats = [
    { label: 'Total Customers', value: statsData.customers.toString(), change: '0%', icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Vendors', value: statsData.vendors.toString(), change: '0%', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Items in Master', value: statsData.items.toString(), change: '0%', icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Revenue', value: '₹0', change: '0%', icon: IndianRupee, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome to your organization's command center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-2.5 rounded-xl transition-transform hover:scale-110 duration-300', stat.bg)}>
                <stat.icon size={22} className={stat.color} />
              </div>
              <span className="text-xs font-bold text-emerald-500 flex items-center bg-emerald-500/10 px-2.5 py-1 rounded-full">
                {stat.change} <ArrowUpRight size={12} className="ml-0.5" />
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center">
        <div className="max-w-md mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Start managing your data</h2>
          <p className="text-muted-foreground mt-2 mb-8">Head over to the Master module to add your first customer or vendor and begin tracking your workflow.</p>
          <a href="/dashboard/master" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
            Go to Master Module
          </a>
        </div>
      </div>
    </div>
  );
}
