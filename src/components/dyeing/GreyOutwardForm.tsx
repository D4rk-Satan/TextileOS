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
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createGreyOutward, getDyeingHouses, getGreyInwardsForOutward } from '@/app/actions/dyeing';

export function GreyOutwardForm({ onSuccess }: { onSuccess?: () => void }) {
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
  const [lotNumbers, setLotNumbers] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const [housesRes, lotsRes] = await Promise.all([
        getDyeingHouses(),
        getGreyInwardsForOutward()
      ]);
      
      if (housesRes?.success) {
        setDyeingHouses((housesRes.data || []).map((h: any) => ({ label: h.vendorName, value: h.id })));
      }
      
      if (lotsRes?.success) {
        setLotNumbers((lotsRes.data || []).map((l: any) => ({ label: l.lotNo, value: l.lotNo })));
      }
    }
    loadData();
  }, []);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createGreyOutward(data);
      if (result.success) {
        alert('Grey Outward entry saved successfully!');
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
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-card rounded-[1.5rem] p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-3">
            <div className="p-1.5 bg-blue-600/10 rounded-lg text-blue-600">
              <Waves size={20} />
            </div>
            <h3 className="text-lg font-black text-foreground tracking-tight uppercase">Grey Outward Form</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
              placeholder="Select Lot Number"
              icon={Hash}
              options={lotNumbers}
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

          <div className="flex items-center gap-4 mt-6">
            <FormButton 
                type="submit" 
                variant="primary" 
                disabled={isSubmitting}
                className="h-10 px-6 rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 flex gap-2"
            >
              <Save size={16} />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </FormButton>
            <FormButton 
                type="button" 
                onClick={onReset} 
                variant="secondary" 
                className="h-10 px-6 rounded-lg font-bold uppercase tracking-wider flex gap-2"
            >
              <RotateCcw size={16} />
              Reset
            </FormButton>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
