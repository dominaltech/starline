import React, { useState, useRef } from 'react';
import { useDb } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  Wrench,
  Download,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { bills, products, customers, workers } = useDb();
  const { isSuperAdmin, role } = useAuth();

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [timeRange, setTimeRange] = useState<'30D' | '6M' | '1Y' | 'ALL'>('ALL');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Filter bills by selected time range
  const now = new Date();
  const filteredBills = bills.filter(b => {
    if (b.is_cancelled) return false;
    if (timeRange === 'ALL') return true;

    const bDate = new Date(b.invoice_date);
    if (isNaN(bDate.getTime())) return true;

    if (timeRange === '30D') {
      const past30 = new Date(now);
      past30.setDate(now.getDate() - 30);
      return bDate >= past30;
    }
    if (timeRange === '6M') {
      const past6m = new Date(now);
      past6m.setMonth(now.getMonth() - 6);
      return bDate >= past6m;
    }
    if (timeRange === '1Y') {
      const past1y = new Date(now);
      past1y.setFullYear(now.getFullYear() - 1);
      return bDate >= past1y;
    }
    return true;
  });

  // Key Aggregations
  const totalRevenue = filteredBills.reduce((acc, b) => acc + b.grand_total, 0);
  const totalBillsCount = filteredBills.length;
  const estimateBills = filteredBills.filter(b => b.bill_type === 'ESTIMATE');
  const gstBills = filteredBills.filter(b => b.bill_type === 'GST');

  const estimateRevenue = estimateBills.reduce((acc, b) => acc + b.grand_total, 0);
  const gstRevenue = gstBills.reduce((acc, b) => acc + b.grand_total, 0);

  const avgTicketSize = totalBillsCount > 0 ? totalRevenue / totalBillsCount : 0;

  // Cost and Profit (Super Admin only)
  let totalCost = 0;
  if (isSuperAdmin) {
    filteredBills.forEach(b => {
      b.items.forEach(it => {
        if (it.product_id) {
          const p = products.find(prod => prod.id === it.product_id);
          totalCost += (p?.buy_price || 0) * it.qty;
        }
      });
    });
  }
  const grossProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Monthly Revenue Grouping for Bar Chart
  const monthlyData: Record<string, { label: string; revenue: number; count: number; gstRev: number; estimateRev: number }> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Initialize last 6 months buckets
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = {
      label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
      revenue: 0,
      count: 0,
      gstRev: 0,
      estimateRev: 0
    };
  }

  filteredBills.forEach(b => {
    if (!b.invoice_date) return;
    const parts = b.invoice_date.split('-');
    if (parts.length >= 2) {
      const key = `${parts[0]}-${parts[1]}`;
      if (!monthlyData[key]) {
        const monIdx = parseInt(parts[1], 10) - 1;
        monthlyData[key] = {
          label: `${monthNames[monIdx] || parts[1]} ${parts[0].slice(-2)}`,
          revenue: 0,
          count: 0,
          gstRev: 0,
          estimateRev: 0
        };
      }
      monthlyData[key].revenue += b.grand_total;
      monthlyData[key].count += 1;
      if (b.bill_type === 'GST') {
        monthlyData[key].gstRev += b.grand_total;
      } else {
        monthlyData[key].estimateRev += b.grand_total;
      }
    }
  });

  const chartMonths = Object.entries(monthlyData).slice(-6);
  const maxMonthRev = Math.max(...chartMonths.map(([, v]) => v.revenue), 1000);

  // Top Selling Products Calculation
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  filteredBills.forEach(b => {
    b.items.forEach(it => {
      const key = it.item_description.trim();
      if (!key) return;
      if (!productSalesMap[key]) {
        productSalesMap[key] = { name: key, qty: 0, revenue: 0 };
      }
      productSalesMap[key].qty += it.qty;
      productSalesMap[key].revenue += it.amount;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxProductRev = Math.max(...topProducts.map(p => p.revenue), 1);

  // Technician / Worker Performance
  const workerStats = workers.map(w => {
    const workerBills = filteredBills.filter(b => b.assigned_worker_id === w.id);
    let done = 0;
    let inProg = 0;
    let cancelled = 0;
    let totalWorkerRev = 0;

    workerBills.forEach(b => {
      totalWorkerRev += b.grand_total;
      b.items.forEach(it => {
        if (it.job_status === 'WORK_DONE') done++;
        else if (it.job_status === 'IN_PROGRESS') inProg++;
        else if (it.job_status === 'CANCELLED') cancelled++;
      });
    });

    return {
      worker: w,
      jobsCount: workerBills.length,
      revenue: totalWorkerRev,
      done,
      inProg,
      cancelled
    };
  });

  // Export Chart Report as PDF
  const handleExportPdf = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`StarLine_Analytics_Dashboard_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to export PDF');
    }
  };

  // Export Chart Report as Image
  const handleExportImage = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `StarLine_Analytics_Chart_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Analytics & Performance Visualizer</h2>
              {role === 'admin' ? (
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-slate-400" /> Margin Redacted (Admin)
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" /> Super Admin Profit Analytics
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Visual trend charts, product velocity, and repair technician KPIs</p>
          </div>
        </div>

        {/* Filters and Exports */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md text-xs font-semibold text-slate-700">
            {(['30D', '6M', '1Y', 'ALL'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded transition-all ${
                  timeRange === range
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {range === '30D' ? '30 Days' : range === '6M' ? '6 Months' : range === '1Y' ? '1 Year' : 'All Time'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <button
              onClick={handleExportImage}
              className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              title="Export as PNG Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportPdf}
              className="p-2 rounded bg-[#0F2942] hover:bg-[#1e3a5f] text-white"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Canvas Container */}
      <div ref={dashboardRef} className="space-y-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Sales Revenue
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{totalBillsCount} Invoices Issued</span>
            </div>
          </div>

          {/* Average Invoice Value */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Avg. Ticket / Invoice Size
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrency(avgTicketSize)}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {estimateBills.length} Retail + {gstBills.length} GST Invoices
            </div>
          </div>

          {/* Gross Margin & Profit (Super Admin Protected) */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Gross Profit & Margin
                </span>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  {isSuperAdmin ? formatCurrency(grossProfit) : '••••••'}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs font-semibold text-emerald-700">
              {isSuperAdmin ? `Margin: ${margin.toFixed(1)}%` : 'Hidden for Admin role'}
            </div>
          </div>

          {/* Customer Dues Summary */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Active Customers
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {customers.length}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-amber-800 font-semibold">
              Receivables: {formatCurrency(customers.reduce((acc, c) => acc + c.dues_balance, 0))}
            </div>
          </div>
        </div>

        {/* Row 2: Monthly Bar Trend & Billing Split Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Bar Chart (2 Cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-900" />
                  <span>Monthly Revenue Trend (Last 6 Months)</span>
                </h3>
                <p className="text-[11px] text-slate-400">Comparing GST Tax Invoices vs Retail Estimates</p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-[#0F2942]"></div>
                  <span className="text-slate-600 font-medium">GST Invoices</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-slate-300"></div>
                  <span className="text-slate-600 font-medium">Retail Estimates</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-4 pt-6 px-2">
              {chartMonths.map(([key, data]) => {
                const totalH = Math.max(12, (data.revenue / maxMonthRev) * 190);
                const gstRatio = data.revenue > 0 ? data.gstRev / data.revenue : 0;
                const gstH = totalH * gstRatio;
                const estH = totalH - gstH;
                const isHovered = hoveredMonth === key;

                return (
                  <div
                    key={key}
                    onMouseEnter={() => setHoveredMonth(key)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="flex-1 flex flex-col items-center group cursor-pointer relative"
                  >
                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-14 z-20 bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap text-center animate-fade-in font-mono">
                        <div className="font-bold">{formatCurrency(data.revenue)}</div>
                        <div className="text-[9.5px] text-slate-300">
                          {data.count} bills (GST: {formatCurrency(data.gstRev)})
                        </div>
                      </div>
                    )}

                    {/* Stacked Bars */}
                    <div className="w-full max-w-[48px] flex flex-col justify-end items-center rounded-t-md overflow-hidden bg-slate-100 transition-all group-hover:opacity-90">
                      {/* Retail Estimate bar top */}
                      <div
                        style={{ height: `${estH}px` }}
                        className="w-full bg-slate-300 transition-all duration-300"
                      />
                      {/* GST bar bottom */}
                      <div
                        style={{ height: `${gstH}px` }}
                        className="w-full bg-[#0F2942] transition-all duration-300"
                      />
                    </div>

                    {/* Label below */}
                    <div className="mt-2 text-[11px] font-semibold text-slate-600 group-hover:text-blue-900 transition-colors">
                      {data.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing Mode Donut Breakdown (1 Col) */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-blue-900" />
                  <span>GST vs Estimate Split</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">{totalBillsCount} total</span>
              </div>

              {/* Donut Chart Graphics */}
              <div className="relative w-44 h-44 mx-auto my-6 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Background Track */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="4"
                  />
                  {/* GST Segment */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#0F2942"
                    strokeWidth="4.2"
                    strokeDasharray={`${totalRevenue > 0 ? (gstRevenue / totalRevenue) * 100 : 0}, 100`}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-slate-400 uppercase font-semibold">GST Share</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {totalRevenue > 0 ? `${((gstRevenue / totalRevenue) * 100).toFixed(0)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0F2942]" />
                  <span className="font-semibold text-slate-700">GST Tax Invoices</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{formatCurrency(gstRevenue)}</span>
                  <span className="text-[10.5px] text-slate-400 block font-mono">{gstBills.length} bills</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="font-semibold text-slate-700">Retail Estimates</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{formatCurrency(estimateRevenue)}</span>
                  <span className="text-[10.5px] text-slate-400 block font-mono">{estimateBills.length} bills</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Top Selling Spares & Technician Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Spare Parts */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-900" />
                <span>Top Selling Spare Parts & Revenue</span>
              </h3>
              <span className="text-[11px] text-slate-400">By sales value</span>
            </div>

            <div className="space-y-4 pt-1">
              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  No parts sold in this time window.
                </div>
              ) : (
                topProducts.map((p, idx) => {
                  const pct = Math.min(100, Math.round((p.revenue / maxProductRev) * 100));
                  return (
                    <div key={p.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{formatCurrency(p.revenue)}</span>
                          <span className="text-slate-400 text-[10.5px] ml-2 font-mono">({p.qty} sold)</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-[#0F2942] rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Technician / Worker Performance Analytics */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-900" />
                <span>Technician Job Status & Productivity</span>
              </h3>
              <span className="text-[11px] text-slate-400">On-site repair tracking</span>
            </div>

            <div className="space-y-4 pt-1">
              {workerStats.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  No technician data available.
                </div>
              ) : (
                workerStats.map((ws) => (
                  <div
                    key={ws.worker.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">{ws.worker.name}</div>
                        <div className="text-[11px] text-slate-500">{ws.worker.specialization || 'Technician'}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(ws.revenue)}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{ws.jobsCount} visits</span>
                      </div>
                    </div>

                    {/* Status metric badges */}
                    <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-[11px]">
                      <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{ws.done} Done</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-700 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ws.inProg} In Progress</span>
                      </div>
                      <div className="flex items-center gap-1 text-rose-700 font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{ws.cancelled} Cancelled</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
