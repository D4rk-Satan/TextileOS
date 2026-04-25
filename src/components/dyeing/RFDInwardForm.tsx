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
  Hash
} from 'lucide-react';
import { createRFDInward, getDyeingHouses, getGreyOutwards } from '@/app/actions/dyeing';

export function RFDInwardForm({ onSuccess }: { onSuccess?: () => void }) {
  const methods = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      lotNo: '',
      dyeingHouse: '',
      remark: '',
    },
    mode: 'onTouched',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dyeingHouses, setDyeingHouses] = useState<any[]>([]);
  const [outwardLots, setOutwardLots] = useState<any[]>([]);

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
        // Fetch lots that were sent out
        setOutwardLots((lotsRes.data || []).map((l: any) => ({ label: l.lotNo, value: l.lotNo })));
      }
    }
    loadData();
  }, []);

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
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-card rounded-[2rem] p-8 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-4">
            <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-600">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight uppercase">RFD Inward Form</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <FormInput
              name="date"
              label="Date"
              type="date"
              required
              icon={Calendar}
            />

            <FormSelect
              name="lotNo"
              label="Lot No"
              required
              placeholder="Select Outward Lot"
              icon={Hash}
              options={outwardLots}
            />

            <FormSelect
              name="dyeingHouse"
              label="Dyeing House"
              required
              placeholder="Select Dyeing House"
              icon={Building2}
              options={dyeingHouses}
            />

            <FormInput
              name="remark"
              label="Remark"
              placeholder="Enter remarks (if any)"
              icon={FileText}
            />
          </div>

          <div className="flex items-center gap-4 mt-10">
            <FormButton 
                type="submit" 
                variant="primary" 
                disabled={isSubmitting}
                className="h-12 px-8 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 flex gap-2"
            >
              <Save size={18} />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </FormButton>
            <FormButton 
                type="button" 
                onClick={onReset} 
                variant="secondary" 
                className="h-12 px-8 rounded-xl font-bold uppercase tracking-wider flex gap-2"
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
