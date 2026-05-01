'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { createItem } from '@/app/actions/master';
import { Package, Hash, Save, RotateCcw } from 'lucide-react';
import { FormHeader } from '@/components/shared/FormHeader';

export function ItemForm({ onSuccess }: { onSuccess?: () => void }) {
  const methods = useForm({
    defaultValues: {
      itemName: '',
      sku: '',
    },
    mode: 'onTouched',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createItem(data);
      if (result.success) {
        alert('Item record created successfully!');
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
        <FormHeader title="Item Information" icon={Package} color="blue" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <FormInput
            name="itemName"
            label="Item Name"
            required
            placeholder="Enter item name"
            icon={Package}
          />

          <FormInput
            name="sku"
            label="SKU"
            required
            placeholder="Enter SKU code"
            icon={Hash}
          />
        </div>

        <div className="flex items-center gap-4 mt-10 pt-0">
          <FormButton 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting} 
            className="h-12 px-10 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 flex gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Record
          </FormButton>
          <FormButton 
            type="button" 
            onClick={onReset} 
            variant="secondary" 
            disabled={isSubmitting} 
            className="h-12 px-10 rounded-xl font-black uppercase tracking-wider flex gap-2"
          >
            <RotateCcw size={18} />
            Reset
          </FormButton>
        </div>
      </form>
    </FormProvider>
  );
}

