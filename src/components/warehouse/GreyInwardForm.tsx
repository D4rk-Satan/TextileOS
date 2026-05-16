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
import { createGreyInward, updateGreyInward, getNextLotNumber } from '@/app/actions/warehouse';
import { getCustomers, getItems } from '@/app/actions/master';

import { FormHeader } from '@/components/shared/FormHeader';
import { toast } from 'sonner';

interface GreyInwardFormProps {
  onSuccess?: () => void;
  initialData?: any; // Maps to complex Prisma object
}

interface FormBatch {
  batchNo: string;
  pcs: string | number;
  mtrs: string | number;
  weight: string | number;
}

interface FormValues {
  lotNo: string;
  quality: string;
  lotNoDisplay: string;
  date: string;
  processType: string;
  status: string;
  customer: string;
  batchDetail: string;
  image: string;
  challanNo: string;
  totalBatch: number;
  totalMtr: string;
  batches: FormBatch[];
}

export function GreyInwardForm({ onSuccess, initialData }: GreyInwardFormProps) {
  const methods = useForm<FormValues>({
    defaultValues: {
      lotNo: initialData?.lotNo || '',
      quality: initialData?.quality || '',
      lotNoDisplay: '',
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      processType: initialData?.processType || '',
      status: initialData?.status || 'In-Warehouse',
      customer: initialData?.customerId || '',
      batchDetail: initialData?.batchDetail || '',
      image: initialData?.image || '',
      challanNo: initialData?.challanNo || '',
      totalBatch: initialData?.totalBatch || 0,
      totalMtr: initialData?.totalMtr?.toString() || '0.00',
      batches: initialData?.batches || [],
    },
    mode: 'onBlur',
  });

  const [batches, batchDetail, lotNo] = useWatch({
    control: methods.control,
    name: ['batches', 'batchDetail', 'lotNo'],
  });

  const totals = useMemo(() => {
    const totalBatch = batches?.length || 0;
    const totalMtr = (batches || []).reduce((acc: number, curr: FormBatch) => {
      const val = typeof curr.mtrs === 'string' ? parseFloat(curr.mtrs) : curr.mtrs;
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return { totalBatch, totalMtr };
  }, [batches]);

  // Sync computed totals to form state
  useEffect(() => {
    methods.setValue('totalBatch', totals.totalBatch);
    methods.setValue('totalMtr', totals.totalMtr.toFixed(2));
  }, [totals, methods]);

  // Auto-populate batches from batchDetail - ONLY IF NOT EDITING
  useEffect(() => {
    if (initialData) return; // Skip auto-generation when editing existing record
    if (!batchDetail || typeof batchDetail !== 'string') return;
    
    const values = batchDetail.split(/[,\n\s]+/)
      .map(v => v.trim())
      .filter(v => v !== '' && !isNaN(parseFloat(v)));

    if (values.length > 0) {
      const currentBatches = methods.getValues('batches');
      
      const currentMtrs = currentBatches?.map((b: FormBatch) => b.mtrs).join(',');
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
  }, [batchDetail, lotNo, methods, initialData]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [customers, setCustomers] = React.useState<{ label: string; value: string }[]>([]);
  const [qualities, setQualities] = React.useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      const [customerRes, itemRes, lotRes] = await Promise.all([
        getCustomers(),
        getItems(),
        !initialData ? getNextLotNumber() : Promise.resolve(null)
      ]);
      
      if (customerRes?.success) {
        setCustomers((customerRes.data || []).map((c: any) => ({ label: c.customerName, value: c.id })));
      }
      
      if (itemRes?.success) {
        setQualities((itemRes.data || []).map((i: any) => ({ label: i.itemName, value: i.itemName })));
      }

      if (!initialData && lotRes?.success && lotRes.data !== undefined) {
        methods.setValue('lotNo', lotRes.data.toString());
      }
    }
    loadData();
  }, [methods, initialData]);

  const refreshLotNumber = async () => {
    if (initialData) return;
    const lotRes = await getNextLotNumber();
    if (lotRes?.success && lotRes.data !== undefined) {
      methods.setValue('lotNo', lotRes.data.toString());
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading(`${initialData ? 'Updating' : 'Saving'} record...`);
    try {
      // Transform data to match GreyInwardData interface
      const submissionData = {
        ...data,
        batches: data.batches.map(batch => ({
          ...batch,
          pcs: typeof batch.pcs === 'string' ? parseInt(batch.pcs) || 0 : batch.pcs,
          mtrs: typeof batch.mtrs === 'string' ? parseFloat(batch.mtrs) || 0 : batch.mtrs,
          weight: typeof batch.weight === 'string' ? parseFloat(batch.weight) || 0 : batch.weight,
        }))
      };

      const result = initialData
        ? await updateGreyInward(initialData.id, submissionData)
        : await createGreyInward(submissionData);
        
      if (result.success) {
        toast.success(`Grey Inward entry ${initialData ? 'updated' : 'saved'} successfully!`, { id: toastId });
        if (!initialData) {
          methods.reset();
          await refreshLotNumber();
        }
        onSuccess?.();
      } else {
        toast.error('Error: ' + result.error, { id: toastId });
      }
    } catch (error) {
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onReset = () => {
    methods.reset();
    refreshLotNumber();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-12">
        {/* Core Details */}
        <div className="space-y-6">
          <FormHeader title="Challan Details" icon={ClipboardList} color="blue" className="mb-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormInput
              name="lotNo"
              label="Lot Number"
              icon={Box}
              readOnly
              variant="dark"
              className="bg-muted/20 font-black text-blue-600 border-blue-500/10"
            />

            <FormInput
              name="date"
              label="Inward Date"
              type="date"
              required
              icon={Calendar}
            />

            <FormSelect
              name="customer"
              label="Customer"
              required
              placeholder="Select customer..."
              icon={Search}
              options={customers}
            />

            <FormInput
              name="challanNo"
              label="Challan Number"
              required
              placeholder="e.g. DC-1024"
              icon={Hash}
            />

            <FormSelect
              name="quality"
              label="Item Quality"
              required
              placeholder="Select quality..."
              icon={Layers}
              options={qualities}
            />

            <FormSelect
              name="processType"
              label="Process Type"
              required
              placeholder="Select process..."
              icon={Settings}
              options={[
                { label: 'RFD & Print', value: 'rfd_print' },
                { label: 'Direct Print', value: 'direct_print' },
              ]}
            />
          </div>
        </div>

        {/* Generation & Stats */}
        <div className="pt-10 border-t border-border/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-600">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-black text-foreground tracking-tight uppercase">Batch Generation</h3>
            </div>

            <div className="flex items-center gap-4 bg-muted/30 border border-border/50 px-5 py-3 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Batches</span>
                <span className="text-sm font-black text-foreground leading-none">{totals.totalBatch}</span>
              </div>
              <div className="w-px h-6 bg-border/50 mx-1" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Meters</span>
                <span className="text-sm font-black text-blue-600 leading-none">{totals.totalMtr.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <FormTextArea
            name="batchDetail"
            label="Input meters separated by commas"
            required
            placeholder="e.g. 98.25, 102.50, 88.00..."
            icon={FileText}
            className="min-h-[120px] bg-muted/5 border-dashed"
          />
        </div>

        {/* Preview Section */}
        <div className="pt-10 border-t border-border/50">
          <BatchInfoForm />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-10 border-t border-border/50">
          <FormButton 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting}
            className="h-14 px-12 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 flex gap-3 transition-all hover:scale-[1.02]"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {initialData ? 'Update Record' : 'Save Inward'}
          </FormButton>
          
          <FormButton 
            type="button" 
            onClick={onReset} 
            variant="secondary" 
            className="h-14 px-12 rounded-2xl text-xs font-black uppercase tracking-widest flex gap-3 transition-all hover:bg-muted"
          >
            <RotateCcw size={20} />
            Reset
          </FormButton>
        </div>
      </form>
    </FormProvider>
  );
}
