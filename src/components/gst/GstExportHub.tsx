import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import {
  generateGstr1Json,
  generateGstr3bJson,
  generateGstr1Excel,
  generateGstr3bExcel,
  filterDataByPeriod,
  GstPeriodFilter
} from '../../utils/gstExportEngine';
import { formatCurrency } from '../../utils/formatters';
import {
  Building2,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';

export const GstExportHub: React.FC = () => {
  const { bills, creditNotes, settings } = useDb();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12

  // Return type tab: GSTR-1 vs GSTR-3B
  const [returnType, setReturnType] = useState<'GSTR1' | 'GSTR3B'>('GSTR1');

  // Compute period filter object
  const monthStr = String(selectedMonth).padStart(2, '0');
  const periodString = `${monthStr}${selectedYear}`; // e.g. "062026"
  const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
  const fromDate = `${selectedYear}-${monthStr}-01`;
  const toDate = `${selectedYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const periodFilter: GstPeriodFilter = {
    year: selectedYear,
    month: selectedMonth,
    periodString,
    fromDate,
    toDate
  };

  const { filteredBills, filteredCreditNotes } = filterDataByPeriod(bills, creditNotes, periodFilter);
  const gstBills = filteredBills.filter(b => b.bill_type === 'GST' && !b.is_cancelled);
  const b2bBills = gstBills.filter(b => b.customer_gstin && b.customer_gstin.trim().length >= 15);
  const b2csBills = gstBills.filter(b => !b.customer_gstin || b.customer_gstin.trim().length < 15);

  const totalTxval = gstBills.reduce((acc, b) => acc + b.taxable_value, 0);
  const totalCgst = gstBills.reduce((acc, b) => acc + b.cgst_amount, 0);
  const totalSgst = gstBills.reduce((acc, b) => acc + b.sgst_amount, 0);

  // Download Handler helper
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJson = () => {
    if (returnType === 'GSTR1') {
      const jsonStr = generateGstr1Json(bills, creditNotes, settings, periodFilter);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const filename = `${settings.gstin || '27ADEPW8222B1ZL'}_GSTR1_${periodString}_${Date.now()}.json`;
      triggerDownload(blob, filename);
    } else {
      const jsonStr = generateGstr3bJson(bills, settings, periodFilter);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const filename = `${settings.gstin || '27ADEPW8222B1ZL'}_GSTR3B_${periodString}_${Date.now()}.json`;
      triggerDownload(blob, filename);
    }
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    if (returnType === 'GSTR1') {
      const buffer = generateGstr1Excel(bills, creditNotes, settings, periodFilter);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `${settings.gstin || '27ADEPW8222B1ZL'}_GSTR1_${selectedYear}-${monthStr}.xlsx`;
      triggerDownload(blob, filename);
    } else {
      const buffer = generateGstr3bExcel(bills, settings, periodFilter);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `${settings.gstin || '27ADEPW8222B1ZL'}_GSTR3B_${selectedYear}-${monthStr}.xlsx`;
      triggerDownload(blob, filename);
    }
  };

  const months = [
    { num: 1, name: 'January' },
    { num: 2, name: 'February' },
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' },
    { num: 11, name: 'November' },
    { num: 12, name: 'December' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">GST Portal Filing & Export Hub</h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Official Offline Utility Compatible
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Direct JSON upload for GST Portal and multi-sheet Excel workbooks for CA review
            </p>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="text-slate-500">Filing GSTIN:</span>
          <div className="font-mono font-bold text-blue-900 text-sm">{settings.gstin}</div>
          <div className="text-[11px] text-slate-400">State: {settings.state_code} - {settings.state_name}</div>
        </div>
      </div>

      {/* Period & Return Type Selector */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Return Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Return Type :</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-md">
              <button
                onClick={() => setReturnType('GSTR1')}
                className={`py-2 text-xs font-bold rounded transition-all ${
                  returnType === 'GSTR1'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                GSTR-1 (Outward Supplies)
              </button>
              <button
                onClick={() => setReturnType('GSTR3B')}
                className={`py-2 text-xs font-bold rounded transition-all ${
                  returnType === 'GSTR3B'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                GSTR-3B (Monthly Summary)
              </button>
            </div>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Return Month :</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="input-field text-xs font-semibold cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name} ({String(m.num).padStart(2, '0')})
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Financial Year :</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="input-field text-xs font-semibold cursor-pointer"
            >
              <option value={2026}>2026 - 2027</option>
              <option value={2025}>2025 - 2026</option>
            </select>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-600 font-medium">
            Filing Period: <strong>{periodString}</strong> ({months[selectedMonth - 1].name} {selectedYear})
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportJson}
              className="btn-primary text-xs px-4 py-2.5 flex-1 sm:flex-initial justify-center"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Export {returnType} JSON</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="btn-secondary text-xs px-4 py-2.5 flex-1 sm:flex-initial justify-center border-slate-300"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export {returnType} Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Review Cards for Selected Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total GST Invoices
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {gstBills.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {b2bBills.length} B2B + {b2csBills.length} B2C Retail
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Taxable Turnover
          </span>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {formatCurrency(totalTxval)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Taxable amount for 18% rate</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            CGST Amount (9%)
          </span>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {formatCurrency(totalCgst)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Central Tax Liability</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            SGST Amount (9%)
          </span>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {formatCurrency(totalSgst)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">State / UT Tax Liability</div>
        </div>
      </div>

      {/* Table Sections breakdown preview */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            {returnType === 'GSTR1' ? 'GSTR-1 Section Wise Aggregations' : 'GSTR-3B Table 3.1 & 4 Overview'}
          </h3>
          <span className="text-[11px] text-slate-500">
            Auto-calculated from Star Line Billing Database
          </span>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {returnType === 'GSTR1' ? (
            <div className="space-y-4">
              {/* B2B Preview */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                <div className="flex justify-between font-bold text-slate-800 pb-2 border-b border-slate-200">
                  <span>1. 4A, 4B, 6B, 6C - B2B Invoices</span>
                  <span>{b2bBills.length} Invoices</span>
                </div>
                <div className="text-slate-600 pt-2">
                  Invoices issued to GST-registered businesses with customer GSTIN.
                </div>
              </div>

              {/* B2CS Preview */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                <div className="flex justify-between font-bold text-slate-800 pb-2 border-b border-slate-200">
                  <span>2. 7 - B2C Small (Retail Counter Supplies)</span>
                  <span>{b2csBills.length} Invoices Aggregated</span>
                </div>
                <div className="text-slate-600 pt-2">
                  Combined rate-wise (18% Intra-State Maharashtra) outward taxable turnover.
                </div>
              </div>

              {/* HSN Preview */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                <div className="flex justify-between font-bold text-slate-800 pb-2 border-b border-slate-200">
                  <span>3. 12 - HSN Wise Summary</span>
                  <span>Auto-grouped by HSN code & quantity</span>
                </div>
                <div className="text-slate-600 pt-2">
                  Includes compressor, capacitor, thermostat, drain motor, and refrigerator spares.
                </div>
              </div>

              {/* Documents Issued */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                <div className="flex justify-between font-bold text-slate-800 pb-2 border-b border-slate-200">
                  <span>4. 13 - Documents Issued</span>
                  <span>{gstBills.length} Net Invoices</span>
                </div>
                <div className="text-slate-600 pt-2">
                  Tracks invoice series from starting to ending number with cancelled count.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                <div className="flex justify-between font-bold text-slate-800 pb-2 border-b border-slate-200">
                  <span>3.1 Outward Taxable Supplies (Other than zero rated)</span>
                  <span>Taxable: {formatCurrency(totalTxval)}</span>
                </div>
                <div className="text-slate-600 pt-2 flex justify-between">
                  <span>Total Central Tax: {formatCurrency(totalCgst)}</span>
                  <span>Total State Tax: {formatCurrency(totalSgst)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
