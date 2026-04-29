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
  Layers,
  Save,
  RotateCcw,
  Building2,
  Hash,
  X
} from 'lucide-react';
import { createRFDInward, getDyeingHouses, getGreyOutwards } from '@/app/actions/dyeing';
import { useWatch } from 'react-hook-form';

export function RFDInwardForm({ onSuccess }: { onSuccess?: () => void }) {
  const methods = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      lotNo: '',
      dyeingHouse: '',
      remark: '',
      batches: [] as any[],
    },
    mode: 'onTouched',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dyeingHouses, setDyeingHouses] = useState<any[]>([]);
  const [outwardLots, setOutwardLots] = useState<any[]>([]);

  const selectedLotNo = useWatch({
    control: methods.control,
    name: 'lotNo'
  });

  useEffect(() => {
    async function loadData() {
      const [housesRes, lotsRes] = await Promise.all([
        getDyeingHouses(),
        getGreyOutwards()
      ]);
      
      if (housesRes?.success) {
        setDyeingHouses((housesRes.data || []).map((h: any) => ({ label: h.vendorName, value: h.id })));
      }
      
      if (lotsRes?.success) {
        setOutwardLots(lotsRes.data || []);
      }
    }
    loadData();
  }, []);

  // Update batches when lot is selected
  useEffect(() => {
    if (selectedLotNo) {
      const lot = outwardLots.find(l => l.lotNo === selectedLotNo);
      if (lot) {
        // Filter for batches that are "Out For Dyeing" or belong to this lot
        methods.setValue('batches', lot.batches || []);
      }
    } else {
      methods.setValue('batches', []);
    }
  }, [selectedLotNo, outwardLots, methods]);

  const removeBatch = (idx: number) => {
    const currentBatches = methods.getValues('batches');
    const updatedBatches = [...(currentBatches || [])];
    updatedBatches.splice(idx, 1);
    methods.setValue('batches', updatedBatches);
  };

  const currentBatches = useWatch({
    control: methods.control,
    name: 'batches'
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createRFDInward(data);
      if (result.success) {
        alert('RFD Inward entry saved successfully!');
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
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-border shadow-xl">
          <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-4">
            <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-600">
              <Layers size={20} />
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight uppercase">RFD Inward</h3>
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
              <FormSelect
                name="lotNo"
                label="Lot No"
                required
                placeholder="Select Outward Lot"
                icon={Hash}
                options={outwardLots.map(l => ({ label: l.lotNo, value: l.lotNo }))}
              />

              <FormInput
                name="remark"
                label="Remark"
                placeholder="Enter remarks (if any)"
                icon={FileText}
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
                    <span className="text-[10px] font-black text-indigo-600 uppercase mb-1">{batch.batchNo}</span>
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
                className="h-12 px-10 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex gap-2"
            >
              <Save size={18} />
              {isSubmitting ? 'Submitting...' : 'Save Inward'}
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
