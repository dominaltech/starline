import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import {
  generateGstr1Json,
  generateGstr3bJson,
  generateGstr1Excel,
  generateGstr3bExcel,
  generateMasterSalesDaybookExcel,
  filterDataByPeriod,
  isValidGstin,
  GstPeriodFilter
} from '../../utils/gstExportEngine';
import { formatCurrency } from '../../utils/formatters';
import {
  Building2,
  FileSpreadsheet,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  CalendarDays
} from 'lucide-react';

export type PeriodMode = 'MONTHLY' | 'QUARTERLY' | 'FY';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export const GstExportHub: React.FC = () => {
  const { bills, creditNotes, settings, b2bBills: mechanicB2bBills } = useDb();

  const now = new Date();
  const currentCalYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Default FY start: In India, if current month is Jan-Mar, FY start is prev year, else current year
  const defaultFyStart = currentMonth >= 4 ? currentCalYear : currentCalYear - 1;

  // Default Quarter
  let defaultQuarter: Quarter = 'Q1';
  if (currentMonth >= 4 && currentMonth <= 6) defaultQuarter = 'Q1';
  else if (currentMonth >= 7 && currentMonth <= 9) defaultQuarter = 'Q2';
  else if (currentMonth >= 10 && currentMonth <= 12) defaultQuarter = 'Q3';
  else defaultQuarter = 'Q4';

  const [periodMode, setPeriodMode] = useState<PeriodMode>('MONTHLY');
  const [selectedYear, setSelectedYear] = useState<number>(currentCalYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedFyStart, setSelectedFyStart] = useState<number>(defaultFyStart);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(defaultQuarter);

  // Return type tab: GSTR-1 vs GSTR-3B
  const [returnType, setReturnType] = useState<'GSTR1' | 'GSTR3B'>('GSTR1');

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

  // Dynamic period calculations
  let fromDate = '';
  let toDate = '';
  let periodString = '';
  let periodLabel = '';

  if (periodMode === 'MONTHLY') {
    const monthStr = String(selectedMonth).padStart(2, '0');
    periodString = `${monthStr}${selectedYear}`; // e.g. "062026"
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    fromDate = `${selectedYear}-${monthStr}-01`;
    toDate = `${selectedYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    periodLabel = `${months[selectedMonth - 1].name} ${selectedYear}`;
  } else if (periodMode === 'QUARTERLY') {
    if (selectedQuarter === 'Q1') {
      fromDate = `${selectedFyStart}-04-01`;
      toDate = `${selectedFyStart}-06-30`;
      periodString = `06${selectedFyStart}`;
      periodLabel = `Q1: Apr – Jun ${selectedFyStart}`;
    } else if (selectedQuarter === 'Q2') {
      fromDate = `${selectedFyStart}-07-01`;
      toDate = `${selectedFyStart}-09-30`;
      periodString = `09${selectedFyStart}`;
      periodLabel = `Q2: Jul – Sep ${selectedFyStart}`;
    } else if (selectedQuarter === 'Q3') {
      fromDate = `${selectedFyStart}-10-01`;
      toDate = `${selectedFyStart}-12-31`;
      periodString = `12${selectedFyStart}`;
      periodLabel = `Q3: Oct – Dec ${selectedFyStart}`;
    } else {
      const nextYr = selectedFyStart + 1;
      fromDate = `${nextYr}-01-01`;
      toDate = `${nextYr}-03-31`;
      periodString = `03${nextYr}`;
      periodLabel = `Q4: Jan – Mar ${nextYr}`;
    }
  } else {
    // Full Financial Year (FY)
    const nextYr = selectedFyStart + 1;
    fromDate = `${selectedFyStart}-04-01`;
    toDate = `${nextYr}-03-31`;
    periodString = `FY${selectedFyStart}-${String(nextYr).slice(2)}`;
    periodLabel = `Financial Year ${selectedFyStart}-${nextYr} (12 Months)`;
  }

  const periodFilter: GstPeriodFilter = {
    year: periodMode === 'MONTHLY' ? selectedYear : selectedFyStart,
    month: periodMode === 'MONTHLY' ? selectedMonth : 0,
    periodString,
    fromDate,
    toDate
  };

  const { filteredBills } = filterDataByPeriod(bills, creditNotes, periodFilter);
  const gstBills = filteredBills.filter(b => b.bill_type === 'GST' && !b.is_cancelled);
  const gstB2bBills = gstBills.filter(b => b.customer_gstin && b.customer_gstin.trim().length >= 15);
  const b2csBills = gstBills.filter(b => !b.customer_gstin || b.customer_gstin.trim().length < 15);

  // Syntax Validation for B2B Buyer GSTINs
  const invalidGstinBills = gstBills.filter(b => {
    if (!b.customer_gstin || b.customer_gstin.trim() === '') return false;
    return !isValidGstin(b.customer_gstin);
  });

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

  // Export JSON (GSTR-1 or GSTR-3B)
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

  // Export Excel (.xlsx) (Government Portal format)
  const handleExportExcel = () => {
    if (returnType === 'GSTR1') {
      const buffer = generateGstr1Excel(bills, creditNotes, settings, periodFilter);
      const blob = new Blob([buffer as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const filename = `${settings.gstin || '27ADEPW8222B1ZL'}_GSTR1_${periodString}.xlsx`;
      triggerDownload(blob, filename);
    } else {
      const buffer = generateGstr3bExcel(bills, settings, periodFilter);
      const blob = new Blob([buffer as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const filename = `${settings.gstin || '27ADEPW8222B1ZL'}_GSTR3B_${periodString}.xlsx`;
      triggerDownload(blob, filename);
    }
  };

  // Export Master Sales Daybook (TallyPrime / CA Format)
  const handleExportMasterDaybook = () => {
    const buffer = generateMasterSalesDaybookExcel(bills, mechanicB2bBills, settings, fromDate, toDate);
    const blob = new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const filename = `Starline_Master_Sales_Daybook_${periodMode}_${periodString}.xlsx`;
    triggerDownload(blob, filename);
  };

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

      {/* GSTIN Format Validator Banner */}
      {invalidGstinBills.length > 0 ? (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-xs space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-black text-amber-900 flex items-center gap-2">
                <span>GST Portal Warning: {invalidGstinBills.length} B2B Invoice(s) have invalid GSTIN syntax!</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-[11.5px] text-amber-800 leading-relaxed">
                The GST Offline Utility and Government Portal will <strong>reject the entire JSON/Excel filing batch</strong> if any buyer GSTIN does not strictly follow statutory format (2 digits state + 10 PAN characters + 1 entity + Z + 1 check digit).
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                {invalidGstinBills.map(b => (
                  <div
                    key={b.id}
                    className="text-[11px] bg-white border border-amber-300 rounded px-2.5 py-1 text-amber-900 font-medium flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="font-mono font-bold text-blue-900">{b.invoice_num}</span>
                    <span className="text-slate-600 font-normal truncate max-w-[120px]">{b.customer_name}:</span>
                    <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      {b.customer_gstin}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : gstB2bBills.length > 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>GSTIN Syntax Verified:</strong> All {gstB2bBills.length} B2B buyer GSTIN(s) in this period follow the statutory format. Ready for GST Portal upload.
            </span>
          </div>
          <span className="text-[10.5px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded whitespace-nowrap">
            100% Valid
          </span>
        </div>
      ) : null}

      {/* Period & Return Type Selector */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-5">
        {/* Period Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setPeriodMode('MONTHLY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                periodMode === 'MONTHLY'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('QUARTERLY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                periodMode === 'QUARTERLY'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quarterly (QRMP)
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('FY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                periodMode === 'FY'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Financial Year (FY)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {fromDate} → {toDate}
            </span>
          </div>
        </div>

        {/* Dynamic Controls based on Period Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Return Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Return Type :</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setReturnType('GSTR1')}
                className={`py-2 text-xs font-bold rounded transition-all ${
                  returnType === 'GSTR1'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                GSTR-1 (Outward)
              </button>
              <button
                type="button"
                onClick={() => setReturnType('GSTR3B')}
                className={`py-2 text-xs font-bold rounded transition-all ${
                  returnType === 'GSTR3B'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                GSTR-3B (Summary)
              </button>
            </div>
          </div>

          {/* Monthly Mode Selectors */}
          {periodMode === 'MONTHLY' && (
            <>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Calendar Year :</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="input-field text-xs font-semibold cursor-pointer"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>
            </>
          )}

          {/* Quarterly Mode Selectors */}
          {periodMode === 'QUARTERLY' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Financial Year :</label>
                <select
                  value={selectedFyStart}
                  onChange={(e) => setSelectedFyStart(parseInt(e.target.value, 10))}
                  className="input-field text-xs font-semibold cursor-pointer"
                >
                  <option value={2026}>FY 2026 - 2027</option>
                  <option value={2025}>FY 2025 - 2026</option>
                  <option value={2024}>FY 2024 - 2025</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quarter (QRMP) :</label>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-md">
                  {(['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSelectedQuarter(q)}
                      className={`py-2 text-[11px] font-bold rounded transition-all ${
                        selectedQuarter === q
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                      title={
                        q === 'Q1'
                          ? 'Apr – Jun'
                          : q === 'Q2'
                          ? 'Jul – Sep'
                          : q === 'Q3'
                          ? 'Oct – Dec'
                          : 'Jan – Mar'
                      }
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Full FY Mode Selectors */}
          {periodMode === 'FY' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Financial Year (Full 12 Months) :</label>
                <select
                  value={selectedFyStart}
                  onChange={(e) => setSelectedFyStart(parseInt(e.target.value, 10))}
                  className="input-field text-xs font-semibold cursor-pointer"
                >
                  <option value={2026}>FY 2026 - 2027 (Apr 2026 – Mar 2027)</option>
                  <option value={2025}>FY 2025 - 2026 (Apr 2025 – Mar 2026)</option>
                  <option value={2024}>FY 2024 - 2025 (Apr 2024 – Mar 2025)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <div className="text-[11px] text-blue-900 bg-blue-50 border border-blue-200 rounded p-2.5">
                  <strong>Annual Mode:</strong> Full-year dataset for GSTR-9 annual return, Income Tax Balance Sheet, and CA audit daybook reconciliation.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Export Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="text-xs text-slate-600 font-medium">
            Filing Period: <strong className="text-slate-900">{periodString}</strong> ({periodLabel})
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={handleExportJson}
              className="btn-primary text-xs px-3.5 py-2.5 flex-1 sm:flex-initial justify-center shadow-xs"
              title="Official GST Portal offline tool compatible JSON"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Export {returnType} JSON</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="btn-secondary text-xs px-3.5 py-2.5 flex-1 sm:flex-initial justify-center border-slate-300"
              title="Multi-sheet Excel workbook matching government offline tool"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export {returnType} Excel</span>
            </button>

            <button
              onClick={handleExportMasterDaybook}
              className="px-3.5 py-2.5 text-xs font-bold text-indigo-950 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-2 flex-1 sm:flex-initial justify-center shadow-xs"
              title="Flat journal sheet with all GST, Retail Estimates, and B2B Mechanic Bills for direct import into TallyPrime / CA Daybooks"
            >
              <BookOpen className="w-4 h-4 text-indigo-700" />
              <span>Master Sales Daybook (.xlsx)</span>
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
            {gstB2bBills.length} B2B + {b2csBills.length} B2C Retail
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
                  <span>{gstB2bBills.length} Invoices</span>
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
