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

interface GreyInwardFormProps {
  onSuccess?: () => void;
  initialData?: any; // Keeping any for now but could be GreyInwardData
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
        alert(`Grey Inward entry ${initialData ? 'updated' : 'saved'} successfully!`);
        if (!initialData) {
          methods.reset();
          await refreshLotNumber();
        }
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
    refreshLotNumber();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {/* Challan Info Wrapper */}
        <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-3 mb-4 border-b border-border/50 pb-2">
            <div className="p-1.5 bg-blue-600/10 rounded-lg text-blue-600">
              <ClipboardList size={18} />
            </div>
            <h3 className="text-md font-black text-foreground tracking-tight uppercase">Challan Info</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <div className="space-y-4">
              <FormInput
                name="lotNo"
                label="Lot No"
                placeholder="Auto-assigned"
                icon={Box}
                readOnly
                variant="dark"
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

              <FormInput
                name="image"
                label="Image"
                placeholder="Image filename / upload"
                icon={ImageIcon}
              />
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  name="totalBatch"
                  label="Total Grey Batch"
                  icon={Hash}
                  variant="dark"
                  readOnly
                />

                <FormInput
                  name="totalMtr"
                  label="Total Grey Mtr"
                  icon={Hash}
                  variant="dark"
                  readOnly
                />
              </div>

              <FormTextArea
                name="batchDetail"
                label="Batch Detail"
                required
                placeholder="Enter comma separated values (e.g. 98.25, 109.25, 82)"
                icon={FileText}
                className="min-h-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Batch Info Section */}
        <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
          <BatchInfoForm />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <FormButton type="submit" variant="primary" className="h-11 px-8 rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 flex gap-2">
            <Save size={18} />
            Save Grey Inward
          </FormButton>
          <FormButton type="button" onClick={onReset} variant="secondary" className="h-11 px-8 rounded-xl text-sm font-black uppercase tracking-wider flex gap-2">
            <RotateCcw size={18} />
            Reset Form
          </FormButton>
        </div>
      </form>
    </FormProvider>
  );
}
