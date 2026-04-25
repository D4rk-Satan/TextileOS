'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { 
  Hash, 
  Calendar, 
  Layers, 
  Settings, 
  CheckCircle, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Building2,
  Box,
  Save,
  RotateCcw,
  ClipboardList
} from 'lucide-react';
import { FormTextArea } from '@/components/shared/FormTextArea';
import { BatchInfoForm } from './BatchInfoForm';
import { motion } from 'framer-motion';
import { createGreyInward } from '@/app/actions/warehouse';
import { getCustomers, getItems } from '@/app/actions/master';

export function GreyInwardForm({ onSuccess }: { onSuccess?: () => void }) {
  const methods = useForm({
    defaultValues: {
      lotNo: '',
      quality: '',
      lotNoDisplay: '',
      date: new Date().toISOString().split('T')[0],
      processType: '',
      status: 'In-Warehouse',
      customer: '',
      batchDetail: '',
      image: '',
      challanNo: '',
      totalBatch: 0,
      totalMtr: '',
      batches: [{ batchNo: '', pcs: '', mtrs: '', weight: '' }],
    },
    mode: 'onTouched',
  });

  const [batches, batchDetail, lotNo] = useWatch({
    control: methods.control,
    name: ['batches', 'batchDetail', 'lotNo'],
  });

  const totals = useMemo(() => {
    const totalBatch = batches?.length || 0;
    const totalMtr = (batches || []).reduce((acc: number, curr: any) => {
      const val = parseFloat(curr.mtrs);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return { totalBatch, totalMtr };
  }, [batches]);

  // Sync computed totals to form state
  useEffect(() => {
    methods.setValue('totalBatch', totals.totalBatch);
    methods.setValue('totalMtr', totals.totalMtr.toFixed(2));
  }, [totals, methods]);

  // Auto-populate batches from batchDetail
  useEffect(() => {
    if (!batchDetail || typeof batchDetail !== 'string') return;
    
    const values = batchDetail.split(/[,\n\s]+/)
      .map(v => v.trim())
      .filter(v => v !== '' && !isNaN(parseFloat(v)));

    if (values.length > 0) {
      const currentBatches = methods.getValues('batches');
      
      // Only update if the values are different to prevent infinite loops or losing manual edits on other fields
      const currentMtrs = currentBatches?.map((b: any) => b.mtrs).join(',');
      const newMtrs = values.join(',');

      if (currentMtrs !== newMtrs) {
        const newBatches = values.map((val, index) => ({
          batchNo: `${lotNo || 'B'}-${index + 1}`,
          pcs: '1',
          mtrs: val,
          weight: '0'
        }));
        methods.setValue('batches', newBatches);
      }
    }
  }, [batchDetail, lotNo, methods]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [qualities, setQualities] = React.useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const [customerRes, itemRes] = await Promise.all([
        getCustomers(),
        getItems()
      ]);
      
      if (customerRes?.success) {
        setCustomers((customerRes.data || []).map((c: any) => ({ label: c.customerName, value: c.id })));
      }
      
      if (itemRes?.success) {
        setQualities((itemRes.data || []).map((i: any) => ({ label: i.itemName, value: i.itemName })));
      }
    }
    loadData();
  }, []);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createGreyInward(data);
      if (result.success) {
        alert('Grey Inward entry saved successfully!');
        methods.reset();
        onSuccess?.();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onReset = () => {
    methods.reset();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-12">
        {/* Challan Info Wrapper */}
        <div className="bg-muted/30 rounded-[2.5rem] p-8 border border-border/50">
          <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-4">
            <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600">
              <ClipboardList size={24} />
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Challan Info</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
            <div className="space-y-6">
              <FormInput
                name="lotNo"
                label="Lot No"
                placeholder="Enter Lot Number"
                icon={Box}
              />

              <FormInput
                name="date"
                label="Date"
                type="date"
                required
                icon={Calendar}
              />

              <FormSelect
                name="customer"
                label="Customers"
                required
                placeholder="Select Customer"
                icon={Search}
                options={customers}
              />

              <FormInput
                name="challanNo"
                label="Challan No"
                required
                placeholder="Enter Challan Number"
                icon={Hash}
              />
            </div>

            <div className="space-y-6">
              <FormSelect
                name="quality"
                label="Quality"
                required
                placeholder="Select Quality"
                icon={Layers}
                options={qualities}
              />

              <FormSelect
                name="processType"
                label="Process Type"
                required
                placeholder="Select Process"
                icon={Settings}
                options={[
                  { label: 'RFD & Print', value: 'rfd_print' },
                  { label: 'Direct Print', value: 'direct_print' },
                ]}
              />
            </div>

            <div className="space-y-6">
              <FormTextArea
                name="batchDetail"
                label="Batch Detail"
                required
                placeholder="Enter comma separated values (e.g. 98.25, 109.25, 82)"
                icon={FileText}
              />
            </div>

            <div className="space-y-6">
              <FormInput
                name="lotNoDisplay"
                label="Lot No For Display"
                placeholder="Display ID"
                icon={Hash}
              />

              <FormSelect
                name="status"
                label="Status"
                placeholder="Select Status"
                icon={CheckCircle}
                options={[
                  { label: 'In-Warehouse', value: 'In-Warehouse' },
                  { label: 'Open', value: 'Open' },
                  { label: 'Started', value: 'Started' },
                  { label: 'Closed', value: 'Closed' },
                ]}
              />

              <FormInput
                name="image"
                label="Image"
                placeholder="Image filename / upload"
                icon={ImageIcon}
              />

              <FormInput
                name="totalBatch"
                label="Total Grey Batch"
                icon={Hash}
                className="bg-muted/30"
              />

              <FormInput
                name="totalMtr"
                label="Total Grey Mtr"
                icon={Hash}
                className="bg-muted/30"
              />
            </div>
          </div>
        </div>

        {/* Batch Info Section */}
        <div className="bg-muted/30 rounded-[2.5rem] p-8 border border-border/50">
          <BatchInfoForm />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-6">
          <FormButton type="submit" variant="primary" className="h-14 px-10 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 flex gap-2">
            <Save size={20} />
            Save Grey Inward
          </FormButton>
          <FormButton type="button" onClick={onReset} variant="secondary" className="h-14 px-10 rounded-2xl text-lg font-black uppercase tracking-widest flex gap-2">
            <RotateCcw size={20} />
            Reset Form
          </FormButton>
        </div>
      </form>
    </FormProvider>
  );
}
