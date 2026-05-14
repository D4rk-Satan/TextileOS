'use client';

import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { GlassCard } from './GlassCard';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<{ success: boolean; count?: number; error?: string }>;
  title: string;
  templateColumns: string[];
}

export function ImportModal({ isOpen, onClose, onImport, title, templateColumns }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      
      Papa.parse(selectedFile, {
        header: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 5) as Record<string, string>[]); // Show first 5 rows
        }
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await onImport(results.data);
        setLoading(false);
        if (res.success) {
          toast.success(`Successfully imported ${res.count} records`);
          onClose();
        } else {
          toast.error(res.error || 'Failed to import data');
        }
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = templateColumns.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_template.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl animate-in fade-in zoom-in duration-300">
        <GlassCard>
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Import {title}</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CSV Data Migration</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Template Download */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary" size={24} />
                  <div>
                    <div className="text-sm font-black text-foreground">Need a template?</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase">Download the pre-formatted CSV</div>
                  </div>
                </div>
                <button 
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-background border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                >
                  Download
                </button>
              </div>

              {/* Upload Area */}
              {!file ? (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-[2rem] p-12 text-center hover:border-primary/50 transition-all bg-muted/5">
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                    <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <Upload className="text-muted-foreground" size={24} />
                    </div>
                    <div className="text-sm font-black text-foreground mb-1">Click to upload or drag and drop</div>
                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">CSV files only</div>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-foreground">{file.name}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">File ready for import</div>
                      </div>
                    </div>
                    <button onClick={() => setFile(null)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Preview Table */}
                  <div className="rounded-2xl border border-border overflow-hidden bg-card/50">
                    <div className="px-4 py-2 bg-muted/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">Data Preview (First 5 Rows)</div>
                    <div className="overflow-x-auto max-h-40">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border">
                            {templateColumns.map(col => (
                              <th key={col} className="px-4 py-2 text-[9px] font-black text-muted-foreground uppercase">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i} className="border-b border-border last:border-0">
                              {templateColumns.map(col => (
                                <td key={col} className="px-4 py-2 text-[10px] font-medium text-foreground truncate max-w-[120px]">{row[col] || row[Object.keys(row).find(k => k.toLowerCase() === col.toLowerCase()) || ''] || '-'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <button
                  disabled={!file || loading}
                  onClick={handleImport}
                  className="flex-1 h-12 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Start Import
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-8 h-12 bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-border transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
