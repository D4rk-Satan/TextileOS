'use client';

import React from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck, 
} from 'lucide-react';
import { FormButton } from '@/components/shared/FormButton';
import { motion } from 'framer-motion';

export default function SuperAdminDashboard() {
  const [organizations, setOrganizations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { getAllOrganizations } = require('@/app/actions/superadmin');

  React.useEffect(() => {
    async function loadData() {
      const result = await getAllOrganizations();
      if (result.success) {
        setOrganizations(result.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const stats = [
    { label: 'Total Clients', value: organizations.length.toString(), change: '+12%', icon: <Building2 className="text-blue-500" /> },
    { label: 'Active Orgs', value: organizations.filter(o => o.status === 'Active').length.toString(), change: '+5%', icon: <ShieldCheck className="text-green-500" /> },
    { label: 'Platform Users', value: organizations.reduce((acc: number, curr: any) => acc + (curr._count?.users || 0), 0).toString(), change: '+18%', icon: <Users className="text-purple-500" /> },
    { label: 'MRR', value: '$84,200', change: '+7%', icon: <TrendingUp className="text-yellow-500" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground font-medium mt-1">Welcome back. Here is what is happening across TextileOS today.</p>
        </div>
        <FormButton variant="primary" className="px-8 shadow-xl shadow-blue-600/20">
          Generate System Report
        </FormButton>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card p-6 rounded-[2rem] border border-border shadow-sm hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:bg-blue-600/10 transition-colors">{stat.icon}</div>
              <span className="text-xs font-bold text-green-500 flex items-center bg-green-500/10 px-3 py-1 rounded-full">
                {stat.change} <ArrowUpRight size={12} className="ml-0.5" />
              </span>
            </div>
            <div className="text-3xl font-black tracking-tight">{stat.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1 opacity-70">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Org Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="text-xl font-black flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full" />
            Recent Organizations
          </h3>
          <button className="text-sm text-blue-600 font-bold hover:underline px-4 py-2 bg-blue-600/5 rounded-lg transition-colors">
            View All Clients
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">
              <tr>
                <th className="px-8 py-5">Organization</th>
                <th className="px-8 py-5">Owner</th>
                <th className="px-8 py-5">Join Date</th>
                <th className="px-8 py-5">Subscription</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-foreground">{org.name}</td>
                  <td className="px-8 py-5 text-sm text-muted-foreground font-medium">{org.users?.[0]?.email || 'N/A'}</td>
                  <td className="px-8 py-5 text-sm text-muted-foreground font-medium italic">
                    {loading ? '...' : new Date(org.createdAt).toISOString().split('T')[0]}
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full ${
                      org.status === 'Active' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {org.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
