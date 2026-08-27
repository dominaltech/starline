import React, { useState } from 'react';
import { Customer } from '../../types';
import { useDb } from '../../context/DbContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { X, User, Phone, MapPin, Building, FileText, CheckCircle } from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, onClose }) => {
  const { bills, saveCustomer } = useDb();

  const [paymentInput, setPaymentInput] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Get customer bills
  const customerBills = bills.filter(b => b.customer_id === customer.id || b.customer_mobile === customer.mobile);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentInput);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    const newDues = Math.max(0, Math.round((customer.dues_balance - amount) * 100) / 100);
    saveCustomer({
      ...customer,
      dues_balance: newDues
    });

    setPaymentInput('');
    setSuccessMsg(`Payment of ₹${amount} recorded successfully. Updated dues: ₹${newDues}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{customer.name}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.mobile}
                </span>
                {customer.gstin && (
                  <span className="flex items-center gap-1 text-blue-900 font-semibold">
                    <Building className="w-3.5 h-3.5" />
                    GSTIN: {customer.gstin}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card & Settle Dues */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
            <div className="flex items-start gap-1.5 text-slate-700">
              <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <span><strong>Address:</strong> {customer.address || 'No address registered'}</span>
            </div>
            <div className="text-slate-500 pt-1">
              Customer since: {formatDate(customer.created_at)} • Total Invoices: {customerBills.length}
            </div>
          </div>

          {/* Dues Balance Box */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                Current Dues Balance
              </span>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {formatCurrency(customer.dues_balance)}
              </div>
            </div>

            {/* Quick Settle Payment */}
            <form onSubmit={handleRecordPayment} className="mt-3 flex gap-1.5">
              <input
                type="number"
                placeholder="Amount ₹"
                value={paymentInput}
                onChange={(e) => setPaymentInput(e.target.value)}
                className="input-field text-xs py-1 px-2 font-bold"
              />
              <button
                type="submit"
                className="btn-primary text-xs py-1 px-3 bg-amber-800 hover:bg-amber-900 border-amber-800"
              >
                Settle
              </button>
            </form>
          </div>
        </div>

        {successMsg && (
          <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Bill History List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-900" />
            <span>Complete Bill History</span>
          </h3>

          <div className="border border-slate-200 rounded-md overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="table-header">
                <tr>
                  <th className="py-2 px-3">Invoice #</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Appliance</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-right">Total (₹)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customerBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                      No invoices recorded for this customer yet.
                    </td>
                  </tr>
                ) : (
                  customerBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold font-mono text-red-600">{b.invoice_num}</td>
                      <td className="py-2 px-3 text-slate-600">{formatDate(b.invoice_date)}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{b.product_name_desc || '-'}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100">
                          {b.bill_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ₹{b.grand_total.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            b.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button onClick={onClose} className="btn-secondary text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
