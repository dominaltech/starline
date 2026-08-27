import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { Bill } from '../../types';
import { formatDate } from '../../utils/formatters';
import { BillPrintTemplate } from './BillPrintTemplate';
import { JobStatusBadge } from './JobStatusBadge';
import {
  Search,
  Printer,
  Ban,
  X,
  FileText,
  Phone
} from 'lucide-react';

export const BillHistory: React.FC = () => {
  const { bills, settings, updateBillJobStatus, cancelBill } = useDb();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Filter bills
  const filteredBills = bills.filter((b) => {
    if (filterType !== 'ALL' && b.bill_type !== filterType) return false;
    if (filterPayment !== 'ALL' && b.payment_status !== filterPayment) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchInv = b.invoice_num.toLowerCase().includes(q);
      const matchCust = b.customer_name.toLowerCase().includes(q);
      const matchMob = b.customer_mobile.includes(q);
      const matchApp = (b.product_name_desc || '').toLowerCase().includes(q);
      return matchInv || matchCust || matchMob || matchApp;
    }
    return true;
  });

  const handleCancelClick = (bill: Bill) => {
    if (bill.is_cancelled) return;
    const confirm = window.confirm(`Are you sure you want to cancel Invoice #${bill.invoice_num}? This will restore product inventory and adjust customer dues.`);
    if (confirm) {
      cancelBill(bill.id, 'User requested cancellation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Invoice #, Customer Name, Mobile, Appliance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-900 bg-white"
            >
              <option value="ALL">All Bills ({bills.length})</option>
              <option value="ESTIMATE">Estimate (Non-GST)</option>
              <option value="GST">GST Tax Invoices</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Payment:</span>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-900 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bill Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header">
              <tr>
                <th className="py-3 px-3">Inv #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer & Mobile</th>
                <th className="py-3 px-3">Appliance</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Total (₹)</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Job Status</th>
                <th className="py-3 px-3 text-center">Technician</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                    No billing records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const firstItem = bill.items[0];
                  const currentJobStatus = firstItem ? firstItem.job_status : 'WORK_DONE';

                  return (
                    <tr
                      key={bill.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        bill.is_cancelled ? 'opacity-60 bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold font-mono text-red-600">
                        {bill.invoice_num}
                        {bill.is_cancelled && (
                          <span className="block text-[10px] text-rose-600 font-semibold font-sans">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(bill.invoice_date)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{bill.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{bill.customer_mobile || '-'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-medium">{bill.product_name_desc || '-'}</div>
                        {bill.brand_model_no && (
                          <div className="text-[11px] text-slate-400">{bill.brand_model_no}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            bill.bill_type === 'GST'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {bill.bill_type === 'GST' ? 'GST (18%)' : 'Estimate'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{bill.grand_total.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            bill.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bill.payment_status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {bill.payment_status}
                        </span>
                      </td>

                      {/* Job Status with interactive toggle */}
                      <td className="py-3 px-3 text-center">
                        <JobStatusBadge
                          status={currentJobStatus}
                          editable={!bill.is_cancelled}
                          onChange={(newStatus) => {
                            if (firstItem) {
                              updateBillJobStatus(bill.id, firstItem.id, newStatus);
                            }
                          }}
                        />
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600 font-medium">
                        {bill.assigned_worker_name || '-'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedBill(bill);
                              setShowPrintModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-900 rounded hover:bg-slate-100"
                            title="View & Print Bill"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {!bill.is_cancelled && (
                            <button
                              onClick={() => handleCancelClick(bill)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                              title="Cancel Bill"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill View & Print Modal */}
      {showPrintModal && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-900" />
                <span>Invoice #{selectedBill.invoice_num}</span>
              </h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded p-2 max-h-[70vh] overflow-y-auto bg-slate-100/50">
              <BillPrintTemplate bill={selectedBill} settings={settings} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill (A5)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
