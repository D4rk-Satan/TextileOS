'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { createVendor } from '@/app/actions/master';
import { ShoppingBag, Save, RotateCcw, User, Hash, MapPin, Globe } from 'lucide-react';
import { FormHeader } from '@/components/shared/FormHeader';

export function VendorForm({ onSuccess }: { onSuccess?: () => void }) {
  const methods = useForm({
    defaultValues: {
      status: 'Active',
      vendorName: '',
      vendorNumber: '',
      booksId: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      gstin: '',
    },
    mode: 'onTouched',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    methods.setValue('status', 'Active');
  }, [methods]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createVendor(data);
      if (result.success) {
        alert('Vendor record created successfully!');
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
        <FormHeader title="Vendor Information" icon={ShoppingBag} color="blue" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <FormInput
            name="vendorName"
            label="Vendor Name"
            required
            placeholder="Primary vendor name"
            icon={User}
          />

          <FormInput
            name="gstin"
            label="GSTIN Number"
            required
            placeholder="e.g. 29ABCDE1234F1Z5"
            icon={Hash}
            rules={{ 
              pattern: { 
                value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 
                message: 'Invalid GSTIN format (India)' 
              } 
            }}
          />

          <FormInput
            name="addressLine1"
            label="Street Address"
            placeholder="Street, building name, etc."
            icon={MapPin}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput name="city" label="City / District" placeholder="City" icon={MapPin} />
            <FormInput name="state" label="State / Province" placeholder="State/UT" icon={MapPin} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput name="postalCode" label="Postal Code" placeholder="6-digits" icon={Hash} />
            <FormSelect
              name="country"
              label="Country"
              icon={Globe}
              options={[
                { label: 'India', value: 'India' },
                { label: 'China', value: 'China' },
                { label: 'Bangladesh', value: 'Bangladesh' },
                { label: 'Vietnam', value: 'Vietnam' },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-10 pt-0">
          <FormButton 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting} 
            className="h-12 px-10 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 flex gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'Saving...' : 'Save Record'}
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

