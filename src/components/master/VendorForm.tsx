'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { createVendor, updateVendor } from '@/app/actions/master';
import { Save, RotateCcw, ShoppingBag, User, MapPin, Hash, Globe, Building2 } from 'lucide-react';
import { FormHeader } from '@/components/shared/FormHeader';

export function VendorForm({ onSuccess, initialData }: { onSuccess?: () => void; initialData?: any }) {
  const methods = useForm({
    defaultValues: {
      status: initialData?.status || 'Active',
      vendorName: initialData?.vendorName || '',
      masterName: initialData?.masterName || '',
      vendorNumber: initialData?.vendorNumber || '',
      booksId: initialData?.booksId || '',
      gstin: initialData?.gstin || '',
      addressLine1: initialData?.addressLine1 || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postalCode: initialData?.postalCode || '',
      country: initialData?.country || 'India',
    },
    mode: 'onTouched',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      methods.reset({
        status: initialData.status,
        vendorName: initialData.vendorName,
        masterName: initialData.masterName,
        vendorNumber: initialData.vendorNumber,
        booksId: initialData.booksId,
        gstin: initialData.gstin,
        addressLine1: initialData.addressLine1,
        city: initialData.city,
        state: initialData.state,
        postalCode: initialData.postalCode,
        country: initialData.country,
      });
    }
  }, [initialData, methods]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = initialData 
        ? await updateVendor(initialData.id, data)
        : await createVendor(data);

      if (result.success) {
        alert(`Vendor record ${initialData ? 'updated' : 'created'} successfully!`);
        if (!initialData) methods.reset();
        onSuccess?.();
      } else {
        alert('Error saving vendor: ' + result.error);
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
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
            placeholder="e.g. 29ABC..."
            icon={Hash}
            rules={{ 
              pattern: { 
                value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 
                message: 'Invalid GSTIN format' 
              } 
            }}
          />
          <FormInput
            name="addressLine1"
            label="Street Address"
            placeholder="Street, building name, etc."
            icon={MapPin}
          />

          <FormInput name="city" label="City" placeholder="City" icon={MapPin} />
          <FormInput name="state" label="State" placeholder="State" icon={MapPin} />
          <FormInput name="postalCode" label="Pincode" placeholder="6-digits" icon={Hash} />

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

