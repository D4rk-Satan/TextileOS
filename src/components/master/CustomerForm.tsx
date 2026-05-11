'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { createCustomer } from '@/app/actions/master';
import { Save, RotateCcw, Users, User, MapPin, Hash, Globe, Phone } from 'lucide-react';
import { FormHeader } from '@/components/shared/FormHeader';

export function CustomerForm({ onSuccess }: { onSuccess?: () => void }) {
  const methods = useForm({
    defaultValues: {
      status: 'Active',
      customerName: '',
      address: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      phone: '',
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
      const result = await createCustomer(data);
      if (result.success) {
        alert('Customer record created successfully!');
        methods.reset();
        onSuccess?.();
      } else {
        alert('Error saving customer: ' + result.error);
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
        <FormHeader title="Customer Information" icon={Users} color="blue" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
          <FormInput
            name="customerName"
            label="Customer Name"
            required
            placeholder="Full legal name"
            icon={User}
            rules={{ minLength: { value: 3, message: 'Name too short' } }}
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
            name="address"
            label="Street Address"
            placeholder="Complete street address"
            icon={MapPin}
          />

          <FormInput name="city" label="City" placeholder="City" icon={MapPin} />
          <FormInput name="state" label="State" placeholder="State" icon={MapPin} />
          <FormInput name="postalCode" label="Pincode" placeholder="6-digit ZIP" icon={Hash} />

          <FormSelect
            name="country"
            label="Country"
            icon={Globe}
            options={[
              { label: 'India', value: 'India' },
              { label: 'United States', value: 'USA' },
              { label: 'United Kingdom', value: 'UK' },
            ]}
          />
          <PhoneInput
            name="phone"
            label="Contact Number"
            required
            icon={Phone}
            rules={{ pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' } }}
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
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Record
              </>
            )}
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

