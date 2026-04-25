'use client';

import React from 'react';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { 
  ArrowLeft, 
  Rocket,
  Code2, 
  X, 
  Share2,
  Globe,
  Users,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const methods = useForm({
    defaultValues: {
      organizationName: '',
      email: '',
      phone: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { registerOrganization } = require('@/app/actions/auth');

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await registerOrganization(data);
      if (result.success) {
        alert('Workspace created successfully! You can now log in.');
        window.location.href = '/login';
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-card rounded-[2rem] shadow-2xl shadow-blue-900/10 overflow-hidden flex flex-col md:flex-row min-h-[650px] border border-border"
      >
        {/* Left Side: Form */}
        <div className="w-full md:w-[480px] p-10 flex flex-col bg-card">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white">T</div>
            <span className="text-xl font-black tracking-tighter text-foreground">TextileOS</span>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-black text-foreground mb-2">Create workspace</h1>
            <p className="text-muted-foreground text-sm font-medium mb-6">to start managing your manufacturing ecosystem</p>

            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                <FormInput 
                  name="organizationName" 
                  label="Organization Name" 
                  required 
                  placeholder="e.g. Paramount Textiles"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput 
                    name="email" 
                    label="Business Email" 
                    type="email" 
                    required 
                    placeholder="name@company.com" 
                  />
                  <PhoneInput 
                    name="phone" 
                    label="Phone Number" 
                    required 
                    rules={{ pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' } }}
                  />
                </div>

                <PasswordInput 
                  name="password" 
                  label="Administrator Password" 
                  required 
                  placeholder="••••••••"
                />

                <FormButton type="submit" variant="primary" className="w-full py-4 text-base font-black shadow-lg shadow-blue-600/20 rounded-xl mt-2">
                  Complete Registration
                </FormButton>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <span className="bg-card px-4">Or sign up with</span>
                  </div>
                </div>

                {/* Social Signups */}
                <div className="flex items-center justify-center gap-4">
                  {[
                    { icon: Code2, color: 'hover:text-foreground' },
                    { icon: Share2, color: 'hover:text-blue-700' },
                    { icon: X, color: 'hover:text-foreground' },
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      type="button"
                      className={`p-3 rounded-xl border border-border bg-muted/30 text-muted-foreground transition-all ${item.color} hover:bg-card hover:shadow-md hover:border-transparent`}
                    >
                      <item.icon size={18} />
                    </button>
                  ))}
                </div>
              </form>
            </FormProvider>
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-bold">
                Log In
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side: Info Panel */}
        <div className="flex-1 bg-gradient-to-br from-indigo-600 to-blue-700 p-12 text-white hidden md:flex flex-col justify-center relative overflow-hidden">
          {/* Abstract Deco */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mt-32 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full -mr-32 -mb-32 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-sm">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-black leading-tight mb-6">
                Join the textile digital revolution.
              </h2>
              <div className="space-y-6">
                {[
                  { icon: Globe, text: 'Manage global supply chains from a single port.' },
                  { icon: Users, text: 'Collaborate with vendors and customers seamlessly.' },
                  { icon: ShieldCheck, text: 'Your data, your control. Enterprise-grade privacy.' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                      <feature.icon size={20} />
                    </div>
                    <p className="text-indigo-100 font-medium opacity-90 group-hover:opacity-100 transition-opacity translate-y-1">{feature.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="mt-12 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === 1 ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
