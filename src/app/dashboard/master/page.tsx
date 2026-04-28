'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Users,
  ShoppingBag,
  Package
} from 'lucide-react';
import { CustomerForm } from '@/components/master/CustomerForm';
import { VendorForm } from '@/components/master/VendorForm';
import { ItemForm } from '@/components/master/ItemForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { MasterTable } from '@/components/shared/MasterTable';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomers, getVendors, getItems } from '@/app/actions/master';

type TabType = 'customers' | 'vendors' | 'items' | 'batches' | 'reports';

function MasterPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async (tab: TabType) => {
    setLoading(true);
    let result;
    if (tab === 'customers') result = await getCustomers();
    else if (tab === 'vendors') result = await getVendors();
    else if (tab === 'items') result = await getItems();

    if (result?.success) {
      setData(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['customers', 'vendors', 'items', 'batches', 'reports'].includes(tab)) {
      setActiveTab(tab);
      setShowForm(false); // Reset form view when switching tabs
      fetchData(tab);
    } else {
      fetchData(activeTab);
    }
  }, [searchParams, activeTab]);

  const handleRecordAdded = () => {
    setShowForm(false);
    fetchData(activeTab);
  };

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground capitalize tracking-tight flex items-center gap-3">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
            {activeTab}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1 font-medium opacity-80">Manage your {activeTab} information and records.</p>
        </div>
        
        {/* Top Add Button removed as per request to eliminate redundancy */}
      </motion.div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-96 flex items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </motion.div>
        ) : showForm ? (
          <div key="form" className="max-w-5xl mx-auto">
             <div className="mb-6 flex items-center justify-between">
                <button 
                  onClick={() => setShowForm(false)}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  ← Back to {activeTab}
                </button>
                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                  New {activeTab.slice(0, -1)} Entry
                </h2>
             </div>
             <GlassCard>
                <div className="p-10">
                  {activeTab === 'customers' && <CustomerForm onSuccess={handleRecordAdded} />}
                  {activeTab === 'vendors' && <VendorForm onSuccess={handleRecordAdded} />}
                  {activeTab === 'items' && <ItemForm onSuccess={handleRecordAdded} />}
                </div>
             </GlassCard>
          </div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Table Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-4 rounded-2xl border border-border backdrop-blur-sm">
               <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Users size={18} />
                     </div>
                     <input 
                       type="text" 
                       placeholder={`Search ${activeTab}...`} 
                       className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-background/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                     />
                  </div>
               </div>
               
               <button 
                 onClick={() => setShowForm(true)}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-[13px]"
               >
                 Add {activeTab.slice(0, -1)}
               </button>
            </div>

            {data.length === 0 ? (
               <div className="bg-card/50 rounded-[2.5rem] border border-border shadow-xl overflow-hidden backdrop-blur-sm p-10">
                  <EmptyState 
                    title={`No ${activeTab} found`}
                    description={`You haven't added any ${activeTab} yet. Start by creating your first one.`}
                    onAdd={() => setShowForm(true)}
                    onImport={() => alert('Import feature coming soon!')}
                  />
               </div>
            ) : (
               <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
                 <MasterTable data={data} type={activeTab === 'customers' ? 'customers' : activeTab === 'vendors' ? 'vendors' : 'items'} />
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder for batches/reports */}
      {(activeTab === 'batches' || activeTab === 'reports') && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-card rounded-[2.5rem] border border-border shadow-xl">
          <div className="w-24 h-24 bg-muted/50 text-muted-foreground/20 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-dashed border-border">
            <Package size={48} />
          </div>
          <h3 className="text-2xl font-black text-foreground uppercase tracking-widest">Coming Soon</h3>
          <p className="text-muted-foreground mt-3 font-medium max-w-sm mx-auto">
            The <span className="text-blue-600 font-bold">{activeTab}</span> module is currently under development.
          </p>
        </div>
      )}
    </div>
  );
}

export default function MasterPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Module...</div>}>
      <MasterPageContent />
    </Suspense>
  );
}
