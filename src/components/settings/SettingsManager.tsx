import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { ShopSettings } from '../../types';
import { WorkerManager } from './WorkerManager';
import { storage } from '../../db/storage';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Building,
  CheckCircle,
  HardDrive
} from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const { settings, saveSettings, refreshData } = useDb();

  const [form, setForm] = useState<ShopSettings>({ ...settings });
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleChange = (field: keyof ShopSettings, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(form);
    setSuccessMsg('Shop settings and profile updated successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Full JSON Backup Export
  const handleExportBackup = () => {
    const backupObj = storage.exportFullBackup();
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const filename = `starline-backup-${dateStr}.json`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // JSON Restore Import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const ok = storage.importFullBackup(parsed);
        if (ok) {
          refreshData();
          setForm(storage.getSettings());
          alert('Database backup restored successfully!');
        } else {
          alert('Failed to restore backup file.');
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // Factory Reset
  const handleFactoryReset = () => {
    const confirm = window.confirm(
      'WARNING: This will reset all customers, bills, inventory, and restore default demo seed data. Are you sure?'
    );
    if (confirm) {
      storage.clearAndReset();
      refreshData();
      setForm(storage.getSettings());
      alert('Database restored to initial Star Line demo state.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">System Settings & Store Profile</h2>
            <p className="text-xs text-slate-500">Configure business information, GST credentials, and database backups</p>
          </div>
        </div>

        {successMsg && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 font-semibold animate-pulse">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Shop Profile Form */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Building className="w-5 h-5 text-blue-900" />
          <h3 className="text-sm font-bold text-slate-900">Business Profile & Bill Header Details</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={form.shop_name}
                onChange={(e) => handleChange('shop_name', e.target.value)}
                className="input-field font-bold text-red-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business GSTIN *</label>
              <input
                type="text"
                required
                value={form.gstin}
                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                className="input-field font-mono font-bold uppercase text-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tagline / Services Line</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              className="input-field italic"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address Line 1</label>
              <input
                type="text"
                value={form.address_line1}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address Line 2 (Area, City)</label>
              <input
                type="text"
                value={form.address_line2}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State Code (GST)</label>
              <input
                type="text"
                value={form.state_code}
                onChange={(e) => handleChange('state_code', e.target.value)}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State Name</label>
              <input
                type="text"
                value={form.state_name}
                onChange={(e) => handleChange('state_name', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone / Mobile Numbers</label>
              <input
                type="text"
                value={form.mobiles}
                onChange={(e) => handleChange('mobiles', e.target.value)}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Starting Invoice Number</label>
              <input
                type="number"
                value={form.starting_invoice_num}
                onChange={(e) => handleChange('starting_invoice_num', parseInt(e.target.value, 10) || 981)}
                className="input-field font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Default Conditions on Printed Bill</label>
            <textarea
              rows={3}
              value={form.default_conditions}
              onChange={(e) => handleChange('default_conditions', e.target.value)}
              className="input-field font-mono"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary text-xs px-4 py-2">
              <Save className="w-4 h-4" />
              <span>Save Business Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Workers Management Component */}
      <WorkerManager />

      {/* Backup & Data Management */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <HardDrive className="w-5 h-5 text-blue-900" />
          <h3 className="text-sm font-bold text-slate-900">Offline Database Backup & Restore</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Backup Download */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Download JSON Backup</h4>
              <p className="text-slate-500 text-[11px]">
                Exports all customers, products, stock movements, credit notes, and invoices into a portable JSON snapshot.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="btn-primary text-xs mt-4 w-full justify-center"
            >
              <Download className="w-4 h-4" />
              <span>Export Full Backup</span>
            </button>
          </div>

          {/* Backup Restore */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Restore from Backup</h4>
              <p className="text-slate-500 text-[11px]">
                Import a previously downloaded `.json` backup file to recover your records.
              </p>
            </div>
            <label className="btn-secondary text-xs mt-4 w-full justify-center cursor-pointer">
              <Upload className="w-4 h-4 text-blue-900" />
              <span>Upload Backup JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-rose-900 mb-1">Reset to Factory Demo</h4>
              <p className="text-rose-700 text-[11px]">
                Clears all custom additions and restores the initial sample repair parts and shop invoices.
              </p>
            </div>
            <button
              onClick={handleFactoryReset}
              className="btn-secondary text-xs mt-4 w-full justify-center border-rose-300 text-rose-800 hover:bg-rose-100"
            >
              <RotateCcw className="w-4 h-4 text-rose-700" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
