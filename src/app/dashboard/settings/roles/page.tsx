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
  Info
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Shield className="text-primary" size={32} />
            ROLES & PERMISSIONS
          </h1>
          <p className="text-muted-foreground font-medium mt-1 uppercase tracking-wider text-xs">
            Configure access levels and security guards for your organization
          </p>
        </div>

        {!isAdding && (
          <FormButton 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6"
          >
            <Plus size={18} />
            CREATE NEW ROLE
          </FormButton>
        )}
      </div>

      {isAdding && (
        <GlassCard className="border-primary/20 ring-1 ring-primary/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isEditing ? 'EDIT ROLE' : 'NEW CUSTOM ROLE'}
              </h2>
              <button 
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(null);
                  setFormData({ name: '', permissions: [] });
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black tracking-widest text-muted-foreground uppercase mb-2 block">
                    Role Name
                  </label>
                  <input
                    placeholder="e.g. Warehouse Manager, Staff User"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm transition-all outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-medium"
                  />
                </div>
                
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                  <Info className="text-primary mt-0.5" size={18} />
                  <p className="text-[11px] leading-relaxed font-medium text-muted-foreground">
                    Assigning permissions will grant the user access to specific modules. 
                    Users with no permissions will only see the dashboard home.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black tracking-widest text-muted-foreground uppercase block">
                  Permissions ({formData.permissions.length})
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {ALL_PERMISSIONS.map((perm) => (
                    <div 
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border",
                        formData.permissions.includes(perm)
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/50 border-border/50 text-muted-foreground hover:border-border hover:bg-muted"
                      )}
                    >
                      <span className="text-xs font-bold uppercase tracking-tight">
                        {PERMISSION_LABELS[perm] || perm}
                      </span>
                      {formData.permissions.includes(perm) ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-3 border-t border-border">
              <FormButton 
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(null);
                  setFormData({ name: '', permissions: [] });
                }}
              >
                CANCEL
              </FormButton>
              <FormButton type="submit">
                {isEditing ? 'UPDATE ROLE CONFIG' : 'ACTIVATE ROLE'}
              </FormButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <GlassCard key={role.id} className="group hover:border-primary/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                <Shield size={20} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(role)}
                  className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(role.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-1">{role.name}</h3>
            <p className="text-xs text-muted-foreground mb-6 font-medium">
              {role?._count?.users || 0} member{role?._count?.users !== 1 ? 's' : ''} assigned
            </p>

            <div className="mt-auto space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ShieldCheck size={12} className="text-primary" />
                Permissions ({role?.permissions?.length || 0})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(role?.permissions || []).slice(0, 3).map((p: string) => (
                  <span key={p} className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-bold text-muted-foreground border border-border/50 uppercase tracking-tighter">
                    {p.split(':')[1] || p}
                  </span>
                ))}
                {(role?.permissions || []).length > 3 && (
                  <span className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-bold text-muted-foreground border border-border/50 uppercase tracking-tighter">
                    +{(role?.permissions || []).length - 3} more
                  </span>
                )}
              </div>
            </div>
          </GlassCard>
        ))}

        {roles.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl">
             <Shield className="mx-auto text-muted-foreground/30 mb-4" size={48} />
             <h3 className="text-xl font-bold text-muted-foreground">NO CUSTOM ROLES DEFINED</h3>
             <p className="text-muted-foreground text-sm mt-1 mb-8">Start by creating access profiles for your team members</p>
             <FormButton onClick={() => setIsAdding(true)} variant="secondary">
                INITIALIZE FIRST ROLE
             </FormButton>
          </div>
        )}
      </div>
    </div>
  );
}
