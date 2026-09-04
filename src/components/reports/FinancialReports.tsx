import React, { useState, useRef } from 'react';
import { useDb } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  BarChart3,
  Calendar,
  Download,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';

export const FinancialReports: React.FC = () => {
  const { bills, b2bBills, products, customers, mechanics, settings } = useDb();
  const { isSuperAdmin, role } = useAuth();

  const reportRef = useRef<HTMLDivElement>(null);

  // Trade Channel Filter ('ALL' | 'RETAIL' | 'B2B')
  const [tradeChannel, setTradeChannel] = useState<'ALL' | 'RETAIL' | 'B2B'>('ALL');

  // Date Filter Range
  const [periodPreset, setPeriodPreset] = useState<string>('THIS_MONTH');
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customTo, setCustomTo] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Compute date boundaries
  const getDates = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (periodPreset === 'TODAY') {
      return { from: todayStr, to: todayStr };
    }
    if (periodPreset === 'THIS_WEEK') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { from: start.toISOString().split('T')[0], to: todayStr };
    }
    if (periodPreset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString().split('T')[0], to: todayStr };
    }
    if (periodPreset === 'THIS_YEAR') {
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: start.toISOString().split('T')[0], to: todayStr };
    }
    return { from: customFrom, to: customTo };
  };

  const { from, to } = getDates();

  // Filter retail bills
  const periodBills = bills.filter(
    b => b.invoice_date >= from && b.invoice_date <= to && !b.is_cancelled
  );

  // Filter B2B mechanic bills
  const periodB2BBills = b2bBills.filter(
    b => b.bill_date >= from && b.bill_date <= to
  );

  const estimateBills = periodBills.filter(b => b.bill_type === 'ESTIMATE');
  const gstBills = periodBills.filter(b => b.bill_type === 'GST');

  // Sales totals based on channel
  const totalEstimateSales = tradeChannel !== 'B2B' ? estimateBills.reduce((acc, b) => acc + b.grand_total, 0) : 0;
  const totalGstSales = tradeChannel !== 'B2B' ? gstBills.reduce((acc, b) => acc + b.grand_total, 0) : 0;
  const totalB2BSales = tradeChannel !== 'RETAIL' ? periodB2BBills.reduce((acc, b) => acc + b.total_amount, 0) : 0;
  const totalGrossSales = totalEstimateSales + totalGstSales + totalB2BSales;

  const activeInvoiceCount = (tradeChannel !== 'B2B' ? periodBills.length : 0) + (tradeChannel !== 'RETAIL' ? periodB2BBills.length : 0);

  // Tax breakdown (GST Invoices)
  const totalTaxable = tradeChannel !== 'B2B' ? gstBills.reduce((acc, b) => acc + b.taxable_value, 0) : 0;
  const totalCgst = tradeChannel !== 'B2B' ? gstBills.reduce((acc, b) => acc + b.cgst_amount, 0) : 0;
  const totalSgst = tradeChannel !== 'B2B' ? gstBills.reduce((acc, b) => acc + b.sgst_amount, 0) : 0;
  const totalTaxCollected = totalCgst + totalSgst;

  // Cost & Profit calculations (Super Admin only)
  let totalCostOfGoods = 0;
  if (isSuperAdmin) {
    if (tradeChannel !== 'B2B') {
      periodBills.forEach(b => {
        b.items.forEach(it => {
          if (it.product_id) {
            const prod = products.find(p => p.id === it.product_id);
            const buyPrice = prod?.buy_price || 0;
            totalCostOfGoods += buyPrice * it.qty;
          }
        });
      });
    }
    if (tradeChannel !== 'RETAIL') {
      periodB2BBills.forEach(b => {
        b.items.forEach(it => {
          const prod = it.product_id
            ? products.find(p => p.id === it.product_id)
            : products.find(p => p.name.toLowerCase() === (it.product_name || '').trim().toLowerCase());
          const buyPrice = prod?.buy_price || 0;
          totalCostOfGoods += buyPrice * it.qty;
        });
      });
    }
  }

  const grossProfit = totalGrossSales - totalTaxCollected - totalCostOfGoods;
  const marginPercentage = (totalGrossSales - totalTaxCollected) > 0
    ? (grossProfit / (totalGrossSales - totalTaxCollected)) * 100
    : 0;

  // Outstanding Dues (Customers + Unlinked Mechanics)
  const customerDues = customers.reduce((acc, c) => acc + (c.dues_balance || 0), 0);
  const custPhones = new Set(customers.map(c => c.mobile.trim()));
  const unlinkedMechDues = mechanics
    .filter(m => !m.phone || !custPhones.has(m.phone.trim()))
    .reduce((acc, m) => acc + (m.dues_balance || 0), 0);
  const totalDuesOutstanding = customerDues + unlinkedMechDues;

  // PDF Export
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`StarLine_Financial_Report_${from}_to_${to}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Failed to generate PDF. Please use browser print.');
    }
  };

  // Image PNG Export
  const handleExportImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `StarLine_BalanceSheet_${from}_to_${to}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Image export failed:', e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Filter & Export Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">CA-Style Balance Sheet & P&L</h2>
              {role === 'admin' ? (
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-slate-400" /> Profit Hidden (Admin)
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-900 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-900" /> Super Admin Profit Visibility
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Financial summary, revenue breakdown, and tax collection statement</p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportImage}
            className="btn-secondary text-xs px-3 py-2"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Image (PNG)</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Selection: Date & Channel */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-900" />
            <span>Report Period:</span>
          </span>

          {['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR', 'CUSTOM'].map((preset) => (
            <button
              key={preset}
              onClick={() => setPeriodPreset(preset)}
              className={`px-3 py-1.5 rounded font-medium transition-all ${
                periodPreset === preset
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset.replace('_', ' ')}
            </button>
          ))}

          {periodPreset === 'CUSTOM' && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-300">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="font-semibold text-slate-700">Trade Channel:</span>
          {(['ALL', 'RETAIL', 'B2B'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setTradeChannel(ch)}
              className={`px-3 py-1 rounded font-semibold transition-all ${
                tradeChannel === ch
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {ch === 'ALL' ? 'All Sales (Retail + B2B)' : ch === 'RETAIL' ? 'Retail Invoices Only' : 'B2B Mechanic Trade Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Printable / Renderable CA Statement Document */}
      <div
        ref={reportRef}
        className="bg-white rounded-lg border border-slate-300 shadow-sm p-8 space-y-6 text-slate-900"
      >
        {/* Statement Header */}
        <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
          <div>
            <div className="text-xl font-black text-red-600 font-serif tracking-tight">
              ★ {settings.shop_name}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {settings.address_line1} {settings.address_line2} • Mob: {settings.mobiles}
            </div>
            <div className="text-xs text-slate-600 font-mono font-semibold">
              GSTIN: {settings.gstin}
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-base font-black uppercase tracking-wider text-slate-900 underline">
              PROFIT & LOSS STATEMENT
            </h1>
            <div className="text-xs font-semibold text-slate-700 mt-1">
              Period: {formatDate(from)} to {formatDate(to)}
            </div>
            <div className="text-[11px] font-medium text-blue-900">
              Channel: {tradeChannel === 'ALL' ? 'All Trade (Retail + B2B)' : tradeChannel === 'RETAIL' ? 'Retail Invoices' : 'B2B Mechanic Trade'}
            </div>
            <div className="text-[11px] text-slate-400">Generated on {new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Revenue (Gross Sales)
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {formatCurrency(totalGrossSales)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{activeInvoiceCount} Bills / Invoices issued</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tax Collected (CGST + SGST)
            </span>
            <div className="text-xl font-black text-blue-900 mt-1">
              {formatCurrency(totalTaxCollected)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{gstBills.length} GST Invoices</div>
          </div>

          {isSuperAdmin ? (
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide flex items-center justify-between">
                <span>Net Gross Profit</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              <div className="text-xl font-black text-emerald-900 mt-1">
                {formatCurrency(grossProfit)}
              </div>
              <div className="text-[11px] font-bold text-emerald-700 mt-1">
                Margin: {marginPercentage.toFixed(1)}%
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center text-center">
              <span className="text-xs text-slate-400 italic">Profit metrics restricted to Super Admin</span>
            </div>
          )}

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
              Outstanding Dues
            </span>
            <div className="text-xl font-black text-amber-900 mt-1">
              {formatCurrency(totalDuesOutstanding)}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">Customers & Mechanics khata</div>
          </div>
        </div>

        {/* Detailed CA Table Breakdown */}
        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="table-header">
              <tr>
                <th className="py-2.5 px-4">Financial Particulars</th>
                <th className="py-2.5 px-4 text-center">Bill/Invoice Count</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tradeChannel !== 'B2B' && (
                <>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      1. Non-GST / Estimate Invoices (Retail Counter)
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono">{estimateBills.length}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">
                      {formatCurrency(totalEstimateSales)}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      2. GST Tax Invoices (Taxable Value)
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono">{gstBills.length}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">
                      {formatCurrency(totalTaxable)}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 bg-blue-50/30">
                    <td className="py-2 px-4 pl-8 text-slate-600">
                      ↳ Central GST (CGST 9%)
                    </td>
                    <td className="py-2 px-4 text-center text-slate-400">-</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-700">
                      {formatCurrency(totalCgst)}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 bg-blue-50/30">
                    <td className="py-2 px-4 pl-8 text-slate-600">
                      ↳ State GST (SGST 9%)
                    </td>
                    <td className="py-2 px-4 text-center text-slate-400">-</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-700">
                      {formatCurrency(totalSgst)}
                    </td>
                  </tr>
                </>
              )}

              {tradeChannel !== 'RETAIL' && (
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                    {tradeChannel === 'B2B' ? '1.' : '3.'} B2B Mechanic Trade Bills (Counter Sales to Garages/Mechanics)
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono">{periodB2BBills.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold">
                    {formatCurrency(totalB2BSales)}
                  </td>
                </tr>
              )}

              <tr className="font-bold bg-slate-50 border-t border-slate-300">
                <td className="py-2.5 px-4">TOTAL GROSS REVENUE (Sales + Tax)</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold">{activeInvoiceCount}</td>
                <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                  {formatCurrency(totalGrossSales)}
                </td>
              </tr>

              {isSuperAdmin && (
                <>
                  <tr className="hover:bg-slate-50 border-t-2 border-slate-300">
                    <td className="py-2.5 px-4 font-semibold text-blue-900">
                      Less: Cost of Spares Sold (COGS from Buy Prices)
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-400">-</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-700">
                      - {formatCurrency(totalCostOfGoods)}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-blue-900">
                      Less: Tax Payable to Government
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-400">-</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-700">
                      - {formatCurrency(totalTaxCollected)}
                    </td>
                  </tr>

                  <tr className="font-black text-sm bg-emerald-50 text-emerald-950 border-t-2 border-emerald-300">
                    <td className="py-3 px-4 uppercase tracking-wider">NET GROSS PROFIT</td>
                    <td className="py-3 px-4 text-center"></td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-900 font-black text-base">
                      {formatCurrency(grossProfit)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Box for CA Audit */}
        <div className="pt-8 flex justify-between items-end text-xs">
          <div className="text-center">
            <div className="border-t border-slate-700 w-44 pt-1 font-semibold">
              Authorized Signatory
            </div>
            <div className="text-[11px] text-slate-500">Star Line Services</div>
          </div>

          <div className="text-center">
            <div className="border-t border-slate-700 w-44 pt-1 font-semibold">
              Chartered Accountant / Tax Auditor
            </div>
            <div className="text-[11px] text-slate-500">Verification & Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
};
