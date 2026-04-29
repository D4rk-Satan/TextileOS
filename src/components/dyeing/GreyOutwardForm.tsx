'use client';

import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { 
  Calendar, 
  Search, 
  FileText, 
  Waves,
  Save,
  RotateCcw,
  Building2,
  Hash,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createGreyOutward, getDyeingHouses, getGreyInwardsForOutward, getNextDCNumber } from '@/app/actions/dyeing';
import { useWatch } from 'react-hook-form';
export function GreyOutwardForm({ onSuccess }: { onSuccess?: () => void }) {
  const methods = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      dcNo: '',
      lotNo: '',
      dyeingHouse: '',
      remark: '',
      stage: 'Dyeing House',
      totalGreyMtr: '0.00',
      totalGreyBatch: 0,
      batches: [] as any[],
    },
    mode: 'onTouched',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dyeingHouses, setDyeingHouses] = useState<any[]>([]);
  const [lotData, setLotData] = useState<any[]>([]);
  
  const selectedLotNo = useWatch({
    control: methods.control,
    name: 'lotNo'
  });

  const refreshDCNumber = async () => {
    const dcRes = await getNextDCNumber();
    if (dcRes?.success && dcRes.data) {
      methods.setValue('dcNo', dcRes.data);
    }
  };

  useEffect(() => {
    async function loadData() {
      const [housesRes, lotsRes, dcRes] = await Promise.all([
        getDyeingHouses(),
        getGreyInwardsForOutward(),
        getNextDCNumber()
      ]);
      
      if (housesRes?.success) {
        setDyeingHouses((housesRes.data || []).map((h: any) => ({ label: h.vendorName, value: h.id })));
      }
      
      if (lotsRes?.success) {
        setLotData(lotsRes.data || []);
      }

      if (dcRes?.success && dcRes.data) {
        methods.setValue('dcNo', dcRes.data);
      }
    }
    loadData();
  }, [methods]);

  // Update totals and batches when lot is selected
  useEffect(() => {
    if (selectedLotNo) {
      const lot = lotData.find(l => l.lotNo === selectedLotNo);
      if (lot) {
        methods.setValue('totalGreyMtr', lot.totalMtr.toFixed(2));
        methods.setValue('totalGreyBatch', lot.batches.length);
        methods.setValue('batches', lot.batches);
      }
    } else {
      methods.setValue('totalGreyMtr', '0.00');
      methods.setValue('totalGreyBatch', 0);
      methods.setValue('batches', []);
    }
  }, [selectedLotNo, lotData, methods]);

  const removeBatch = (idx: number) => {
    const updatedBatches = [...(currentBatches || [])];
    updatedBatches.splice(idx, 1);
    
    // Recalculate totals
    const totalMtr = updatedBatches.reduce((acc, curr) => acc + (Number(curr.mtrs) || 0), 0);
    
    methods.setValue('batches', updatedBatches);
    methods.setValue('totalGreyMtr', totalMtr.toFixed(2));
    methods.setValue('totalGreyBatch', updatedBatches.length);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createGreyOutward(data);
      if (result.success) {
        alert('Grey Outward entry saved successfully!');
        methods.reset();
        await refreshDCNumber();
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
    refreshDCNumber();
  };

  const currentBatches = useWatch({
    control: methods.control,
    name: 'batches'
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-border shadow-xl">
          <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-4">
            <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600">
              <Waves size={20} />
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Grey Outward</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <div className="space-y-6">
              <FormInput
                name="date"
                label="Date"
                type="date"
                required
                icon={Calendar}
              />

              <FormSelect
                name="dyeingHouse"
                label="Dyeing House"
                required
                placeholder="Select Dyeing House"
                icon={Building2}
                options={dyeingHouses}
              />
            </div>

            <div className="space-y-6">
              <FormInput
                name="dcNo"
                label="DC No"
                placeholder="Auto-assigned"
                icon={Hash}
                readOnly
                variant="dark"
              />

              <FormSelect
                name="lotNo"
                label="Lot No"
                required
                placeholder="Select Lot Number"
                icon={Hash}
                options={lotData.map(l => ({ label: l.lotNo, value: l.lotNo }))}
              />

              <FormInput
                name="remark"
                label="Remark"
                placeholder="Enter remarks (if any)"
                icon={FileText}
              />
            </div>

            <div className="space-y-6">
              <FormSelect
                name="stage"
                label="Stage"
                required
                icon={Search}
                options={[
                  { label: 'Dyeing House', value: 'Dyeing House' },
                  { label: 'Partial received', value: 'Partial received' },
                  { label: 'received', value: 'received' },
                ]}
              />

              <FormInput
                name="totalGreyMtr"
                label="Total Grey Mtr"
                icon={Hash}
                readOnly
                variant="dark"
              />

              <FormInput
                name="totalGreyBatch"
                label="Total Grey Batch"
                icon={Hash}
                readOnly
                variant="dark"
              />
            </div>
          </div>

          {/* Batch info display */}
          {currentBatches && currentBatches.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border/50">
              <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Batch Info</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {currentBatches.map((batch: any, idx: number) => (
                  <div key={idx} className="bg-muted/30 p-3 rounded-xl border border-border/50 flex flex-col items-center relative group">
                    <button
                      type="button"
                      onClick={() => removeBatch(idx)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                    >
                      <X size={10} />
                    </button>
                    <span className="text-[10px] font-black text-blue-600 uppercase mb-1">{batch.batchNo}</span>
                    <span className="text-sm font-bold text-foreground">{batch.mtrs.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-10">
            <FormButton 
                type="submit" 
                variant="primary" 
                disabled={isSubmitting}
                className="h-12 px-10 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-blue-600/20 flex gap-2"
            >
              <Save size={18} />
              {isSubmitting ? 'Submitting...' : 'Save Outward'}
            </FormButton>
            <FormButton 
                type="button" 
                onClick={onReset} 
                variant="secondary" 
                className="h-12 px-10 rounded-xl font-bold uppercase tracking-wider flex gap-2"
            >
              <RotateCcw size={18} />
              Reset
            </FormButton>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
