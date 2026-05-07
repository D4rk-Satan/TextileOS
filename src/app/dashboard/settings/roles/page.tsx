'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/shared/GlassCard';
import { FormButton } from '@/components/shared/FormButton';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  ShieldCheck,
  ChevronRight,
  Info,
  UserCircle
} from 'lucide-react';
import { getRoles, createRole, updateRole, deleteRole } from '@/app/actions/roles';
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '@/lib/permissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[]
  });

  const fetchRoles = async () => {
    setIsLoading(true);
    const result = await getRoles();
    if (result.success && result.data) {
      setRoles(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Role name is required');
      return;
    }

    const result = isEditing 
      ? await updateRole(isEditing, formData)
      : await createRole(formData);

    if (result.success) {
      toast.success(isEditing ? 'Role updated' : 'Role created');
      setIsAdding(false);
      setIsEditing(null);
      setFormData({ name: '', permissions: [] });
      fetchRoles();
    } else {
      toast.error(result.error);
    }
  };

  const handleEdit = (role: any) => {
    setIsEditing(role.id);
    setFormData({
      name: role.name,
      permissions: role.permissions
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    const result = await deleteRole(id);
    if (result.success) {
      toast.success('Role deleted');
      fetchRoles();
    } else {
      toast.error(result.error);
    }
  };

  if (isLoading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground font-bold animate-pulse">
        LOADING ROLES SYSTEM...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5">
               <Shield size={32} strokeWidth={2.5} />
            </div>
            ROLES & ACCESS
          </h1>
          <p className="text-muted-foreground font-semibold mt-2 uppercase tracking-[0.2em] text-[10px] opacity-70">
            Enterprise Identity & Access Management
          </p>
        </div>

        {!isAdding && (
          <FormButton 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 px-8 h-12 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Plus size={20} strokeWidth={3} />
            CREATE CUSTOM ROLE
          </FormButton>
        )}
      </div>

      {isAdding && (
        <GlassCard className="border-primary/20 ring-1 ring-primary/10 p-0 overflow-hidden bg-card/30">
          <form onSubmit={handleSubmit}>
            <div className="px-8 py-6 flex items-center justify-between border-b border-border/50 bg-muted/30">
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  {isEditing ? 'MODIFY ROLE CONFIGURATION' : 'CONFIGURE NEW ROLE'}
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                   Defining granular security permissions
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(null);
                  setFormData({ name: '', permissions: [] });
                }}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
                    <Edit2 size={12} className="text-primary" />
                    Role Assignment Name
                  </label>
                  <input
                    placeholder="e.g. Senior Warehouse Manager"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex h-14 w-full rounded-2xl border border-border bg-card/50 px-6 py-2 text-sm transition-all outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-bold shadow-inner placeholder:text-muted-foreground/30"
                  />
                </div>
                
                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <Info size={48} />
                  </div>
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck size={14} />
                     Security Guard Protocol
                  </h4>
                  <p className="text-[11px] leading-relaxed font-medium text-muted-foreground relative z-10">
                    Permissions granted here are absolute. Users assigned to this role will have immediate access to the toggled modules. Users with no permissions are defaulted to the Dashboard Home only.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
                     <Shield size={12} className="text-primary" />
                     Authorized Modules ({formData.permissions.length})
                   </label>
                   <span className="text-[9px] font-black text-muted-foreground/50 uppercase">Select all that apply</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2.5 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                  {ALL_PERMISSIONS.map((perm) => (
                    <div 
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={cn(
                        "group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border",
                        formData.permissions.includes(perm)
                          ? "bg-primary/10 border-primary/40 shadow-inner"
                          : "bg-muted/20 border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                          formData.permissions.includes(perm)
                            ? "bg-primary text-primary-foreground rotate-0 scale-110"
                            : "bg-muted text-muted-foreground -rotate-6 group-hover:rotate-0"
                        )}>
                          <ShieldCheck size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-tight block leading-none">
                            {PERMISSION_LABELS[perm] || perm}
                          </span>
                          <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter mt-1 block">
                             {perm.split(':')[0]} access level
                          </span>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                        formData.permissions.includes(perm)
                          ? "bg-primary border-primary scale-110"
                          : "border-border group-hover:border-primary/50"
                      )}>
                        {formData.permissions.includes(perm) && <CheckCircle2 size={14} className="text-primary-foreground" strokeWidth={3} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end p-8 gap-4 border-t border-border/50 bg-muted/10">
              <FormButton 
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(null);
                  setFormData({ name: '', permissions: [] });
                }}
                className="px-8 rounded-xl font-bold"
              >
                CANCEL
              </FormButton>
              <FormButton type="submit" className="px-10 rounded-xl shadow-lg shadow-primary/20">
                {isEditing ? 'SAVE CONFIGURATION' : 'ACTIVATE ROLE'}
              </FormButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {roles.map((role) => (
          <GlassCard key={role.id} className="group hover:border-primary/40 transition-all duration-500 relative overflow-hidden bg-card/40 border-border/50">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-700 pointer-events-none">
               <Shield size={120} strokeWidth={1} />
            </div>

            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ring-1 ring-primary/20">
                <Shield size={24} strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEdit(role)}
                  className="p-2.5 rounded-xl bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all border border-border/50 hover:border-primary/30"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(role.id)}
                  className="p-2.5 rounded-xl bg-muted/50 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all border border-border/50 hover:border-destructive/30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-1 mb-8 relative z-10">
               <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">{role.name}</h3>
               <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                     {[1, 2, 3].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full bg-muted border border-background flex items-center justify-center">
                           <UserCircle size={10} className="text-muted-foreground" />
                        </div>
                     ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                    {role?._count?.users || 0} ACTIVE MEMBERS
                  </p>
               </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border/50 relative z-10">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 opacity-70">
                <ShieldCheck size={12} className="text-primary" />
                SECURITY PRIVILEGES ({role?.permissions?.length || 0})
              </div>
              <div className="flex flex-wrap gap-2">
                {(role?.permissions || []).slice(0, 4).map((p: string) => (
                  <span key={p} className="px-3 py-1 bg-primary/5 rounded-lg text-[9px] font-black text-primary border border-primary/20 uppercase tracking-tight">
                    {p.split(':')[1] || p}
                  </span>
                ))}
                {(role?.permissions || []).length > 4 && (
                  <span className="px-3 py-1 bg-muted rounded-lg text-[9px] font-black text-muted-foreground border border-border uppercase">
                    +{(role?.permissions || []).length - 4} MORE
                  </span>
                )}
              </div>
            </div>
            
            <button 
               onClick={() => handleEdit(role)}
               className="w-full mt-8 py-3 rounded-xl border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all duration-300"
            >
               VIEW FULL CONFIGURATION
            </button>
          </GlassCard>
        ))}

        {roles.length === 0 && !isAdding && (
          <div className="col-span-full py-32 text-center border-4 border-dashed border-border/50 rounded-[3rem] bg-muted/5 group hover:border-primary/30 transition-all duration-500">
             <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Shield className="text-muted-foreground/20 group-hover:text-primary/20 transition-colors" size={56} strokeWidth={1} />
             </div>
             <h3 className="text-2xl font-black text-muted-foreground tracking-tight uppercase">NO ACCESS PROFILES DEFINED</h3>
             <p className="text-muted-foreground text-xs mt-2 mb-10 font-medium uppercase tracking-widest opacity-60 max-w-sm mx-auto">
                Security roles allow you to delegate module access to your team members safely.
             </p>
             <FormButton 
                onClick={() => setIsAdding(true)} 
                variant="secondary"
                className="px-12 h-14 rounded-2xl font-black border-2"
              >
                INITIALIZE SECURITY LAYER
             </FormButton>
          </div>
        )}
      </div>
    </div>
  );
}
