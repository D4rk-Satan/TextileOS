'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { Package, Hash, Save, RotateCcw } from 'lucide-react';
import { createItem } from '@/app/actions/master';

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
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-10">
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

        <div className="flex gap-4 pt-8 border-t border-border">
          <FormButton type="submit" variant="primary" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl text-[13px] font-bold shadow-lg shadow-blue-600/10 flex items-center gap-2">
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Create Item
          </FormButton>
          <FormButton type="button" onClick={onReset} variant="secondary" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl text-[13px] font-bold border flex items-center gap-2">
            <RotateCcw size={16} />
            Clear Fields
          </FormButton>
        </div>
      </form>
    </FormProvider>
  );
}
