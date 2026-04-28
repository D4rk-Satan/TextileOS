'use client';

import React from 'react';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const methods = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = (data: any) => {
    console.log('Login attempt:', data);
    // Simulate login redirect
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />

      <div className="w-full max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-sm font-bold"
          >
            <Sparkles size={16} />
            <span>The Next Generation of Textile Management</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent"
          >
            TextileOS
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl text-xl text-muted-foreground leading-relaxed font-medium"
          >
            The all-in-one SaaS platform for textile manufacturers to manage their entire ecosystem with precision and ease.
          </motion.p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Login Module (Now Primary) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card p-10 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden backdrop-blur-sm"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
            
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black tracking-tight">Welcome Back</h2>
              <p className="text-muted-foreground mt-2 font-medium">Log in to your workspace</p>
            </div>

            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
                <FormInput
                  name="email"
                  label="Business Email"
                  type="email"
                  required
                  placeholder="name@company.com"
                />
                
                <div className="space-y-2">
                  <PasswordInput
                    name="password"
                    label="Password"
                    required
                  />
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      className="text-xs text-blue-600 hover:underline font-bold"
                      suppressHydrationWarning
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <FormButton type="submit" variant="primary" className="w-full py-7 text-lg font-black group shadow-lg shadow-blue-600/20">
                    <span className="flex items-center justify-center gap-2">
                      Sign In to Dashboard
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </FormButton>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                      <span className="bg-card px-3 text-muted-foreground">New to TextileOS?</span>
                    </div>
                  </div>

                  <Link href="/signup" className="block">
                    <FormButton variant="secondary" className="w-full py-6 font-bold border-2 hover:bg-muted/50 transition-all">
                      Register Organization
                    </FormButton>
                  </Link>
                </div>
              </form>
            </FormProvider>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center justify-center gap-8 text-muted-foreground/60"
          >
            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
              <ShieldCheck size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Secure</span>
            </div>
            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
              <Zap size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Fast</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
