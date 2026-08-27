import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { CreditNote } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { NewCreditNoteModal } from './NewCreditNoteModal';
import { RotateCcw, Plus, Search } from 'lucide-react';

export const CreditNoteManager: React.FC = () => {
  const { creditNotes } = useDb();

  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredNotes = creditNotes.filter((cn) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      cn.note_num.toLowerCase().includes(q) ||
      cn.original_invoice_num.toLowerCase().includes(q) ||
      cn.customer_name.toLowerCase().includes(q) ||
      cn.item_description.toLowerCase().includes(q)
    );
  });

  const totalCreditValue = creditNotes.reduce((acc, cn) => acc + cn.total_value, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Credit Notes & Stock Returns ({creditNotes.length})</h2>
            <p className="text-xs text-slate-500">Manage parts returned, dues adjustments, and GST CDNR reporting</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Total Credit Value:</span>
            <span className="font-bold text-slate-800">{formatCurrency(totalCreditValue)}</span>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Credit Note</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by Credit Note #, Original Invoice #, Customer, or Returned Part..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-9 text-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* Credit Notes Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header">
              <tr>
                <th className="py-3 px-4">Credit Note #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Orig. Invoice #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Returned Item & Qty</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-4 text-right">Taxable Value</th>
                <th className="py-3 px-4 text-right">Total Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No credit notes issued yet.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((cn) => (
                  <tr key={cn.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold font-mono text-blue-900">
                      {cn.note_num}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {formatDate(cn.note_date)}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-red-600">
                      #{cn.original_invoice_num}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{cn.customer_name}</div>
                      {cn.customer_gstin && (
                        <div className="text-[10px] text-blue-900 font-mono font-semibold">
                          GSTIN: {cn.customer_gstin} (B2B CDNR)
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-800">
                      <div className="font-medium">{cn.item_description}</div>
                      <div className="text-[11px] text-slate-500 font-mono font-bold">
                        Qty Returned: {cn.qty}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                      {cn.reason || '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      ₹{cn.taxable_value.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-rose-700">
                      ₹{cn.total_value.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Credit Note Modal */}
      {showNewModal && (
        <NewCreditNoteModal onClose={() => setShowNewModal(false)} />
      )}
    </div>
  );
};
