'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Users,
  ShoppingBag,
  Package,
  Search
} from 'lucide-react';
import { CustomerForm } from '@/components/master/CustomerForm';
import { VendorForm } from '@/components/master/VendorForm';
import { ItemForm } from '@/components/master/ItemForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { MasterTable } from '@/components/shared/MasterTable';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomers, getVendors, getItems } from '@/app/actions/master';
import { getUserRole } from '@/app/actions/auth';
import { ModuleHeader } from '@/components/layout/ModuleHeader';

type TabType = 'customers' | 'vendors' | 'items' | 'batches' | 'reports';

function MasterPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [fetchedTab, setFetchedTab] = useState<TabType | null>(null);
  const [userRole, setUserRole] = useState<string>('User');

  const fetchData = async (tab: TabType) => {
    setLoading(true);
    const role = await getUserRole();
    setUserRole(role);

    setData([]);
    let result;
    if (tab === 'customers') result = await getCustomers();
    else if (tab === 'vendors') result = await getVendors();
    else if (tab === 'items') result = await getItems();

    if (result?.success) {
      setData(result.data || []);
    }
    setFetchedTab(tab);
    setLoading(false);
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['customers', 'vendors', 'items', 'batches', 'reports'].includes(tab)) {
      setActiveTab(tab);
      setShowForm(false);
      fetchData(tab);
    } else {
      fetchData(activeTab);
    }
  }, [searchParams, activeTab]);

  const handleRecordAdded = () => {
    setShowForm(false);
    fetchData(activeTab);
  };

  // RBAC: Only Admin can add Customers/Vendors. All can add Items.
  const role = userRole?.toLowerCase();
  const canAdd = role === 'admin' || activeTab === 'items';

  return (
    <div className="space-y-8">
      <ModuleHeader 
        title={activeTab}
        subtitle="Master"
        icon={activeTab === 'customers' ? Users : activeTab === 'vendors' ? ShoppingBag : Package}
        searchPlaceholder={`Search through ${activeTab}...`}
        showSearch={!showForm}
        actionButton={!showForm && canAdd && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-12 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
               <span className="text-lg leading-none">+</span>
            </div>
            Add {activeTab.slice(0, -1)}
          </button>
        )}
      />

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {loading || fetchedTab !== activeTab ? (
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
          <motion.div 
            key={`${activeTab}-form`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-5xl mx-auto"
          >
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
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Table Control Bar removed and moved to header */}

            {data.length === 0 ? (
               <div className="bg-card/50 rounded-[2.5rem] border border-border shadow-xl overflow-hidden backdrop-blur-sm p-10">
                  <EmptyState 
                    title={`No ${activeTab} found`}
                    description={`You haven't added any ${activeTab} yet. Start by creating your first one.`}
                    onAdd={canAdd ? () => setShowForm(true) : undefined}
                    onImport={() => alert('Import feature coming soon!')}
                  />
               </div>
            ) : (
               <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
                 <MasterTable 
                    data={data} 
                    userRole={userRole}
                    type={activeTab === 'customers' ? 'customers' : activeTab === 'vendors' ? 'vendors' : 'items'} 
                  />
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder for batches/reports */}
      {(activeTab === 'batches' || activeTab === 'reports') && (
        <div className="bg-card/50 rounded-[2.5rem] border border-border shadow-xl overflow-hidden backdrop-blur-sm">
           <EmptyState 
             title={`${activeTab} Coming Soon`}
             description={`The ${activeTab} module is currently under development. Check back soon for updates!`}
             icon={<Package size={48} className="text-blue-600/20" />}
           />
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
