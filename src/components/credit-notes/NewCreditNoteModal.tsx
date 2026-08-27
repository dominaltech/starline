import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { CreditNote } from '../../types';
import { formatDateInput } from '../../utils/formatters';
import { X, RotateCcw } from 'lucide-react';

interface NewCreditNoteModalProps {
  onClose: () => void;
}

export const NewCreditNoteModal: React.FC<NewCreditNoteModalProps> = ({ onClose }) => {
  const { bills, settings, createCreditNote } = useDb();

  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [noteNum, setNoteNum] = useState<string>(`CN-${settings.starting_credit_note_num || 101}`);
  const [noteDate, setNoteDate] = useState<string>(formatDateInput());
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [reason, setReason] = useState<string>('Defective part replaced / Customer return');

  const selectedBill = bills.find(b => b.id === selectedBillId);
  const selectedItem = selectedBill?.items.find(i => i.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !selectedItem) {
      alert('Please select an invoice and a line item to return.');
      return;
    }

    const rate = selectedItem.rate || (selectedItem.amount / (selectedItem.qty || 1));
    const taxable = Math.round(rate * returnQty * 100) / 100;
    const taxRate = selectedItem.tax_rate || (selectedBill.bill_type === 'GST' ? 18 : 0);
    const halfTax = taxRate / 2;
    const cgst = Math.round(((taxable * halfTax) / 100) * 100) / 100;
    const sgst = Math.round(((taxable * halfTax) / 100) * 100) / 100;
    const total = Math.round((taxable + cgst + sgst) * 100) / 100;

    const newNote: Omit<CreditNote, 'id' | 'created_at'> = {
      note_num: noteNum.trim(),
      note_date: noteDate,
      original_bill_id: selectedBill.id,
      original_invoice_num: selectedBill.invoice_num,
      customer_id: selectedBill.customer_id,
      customer_name: selectedBill.customer_name,
      customer_gstin: selectedBill.customer_gstin,
      note_type: 'C',
      reason: reason.trim(),
      product_id: selectedItem.product_id,
      item_description: selectedItem.item_description,
      qty: returnQty,
      tax_rate: taxRate,
      taxable_value: taxable,
      cgst_amount: cgst,
      sgst_amount: sgst,
      total_value: total
    };

    createCreditNote(newNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-900" />
            <span>Issue Credit Note / Stock Return</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Credit Note # *</label>
              <input
                type="text"
                required
                value={noteNum}
                onChange={(e) => setNoteNum(e.target.value)}
                className="input-field font-mono font-bold text-blue-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Note Date *</label>
              <input
                type="date"
                required
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Original Invoice *</label>
            <select
              value={selectedBillId}
              onChange={(e) => {
                setSelectedBillId(e.target.value);
                setSelectedItemId('');
              }}
              required
              className="input-field cursor-pointer font-medium"
            >
              <option value="">-- Choose Invoice --</option>
              {bills.filter(b => !b.is_cancelled).map((b) => (
                <option key={b.id} value={b.id}>
                  Invoice #{b.invoice_num} — {b.customer_name} (₹{b.grand_total})
                </option>
              ))}
            </select>
          </div>

          {selectedBill && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Returned Spare Item *</label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  const it = selectedBill.items.find(i => i.id === e.target.value);
                  if (it) setReturnQty(it.qty);
                }}
                required
                className="input-field cursor-pointer"
              >
                <option value="">-- Choose Item from Invoice --</option>
                {selectedBill.items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.item_description} (Sold Qty: {it.qty}, Rate: ₹{it.rate || it.amount})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedItem && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Return Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.qty}
                  value={returnQty}
                  onChange={(e) => setReturnQty(parseInt(e.target.value, 10) || 1)}
                  className="input-field font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Credit Value</label>
                <div className="text-sm font-black text-slate-900 pt-1">
                  ₹{((selectedItem.rate || (selectedItem.amount / selectedItem.qty)) * returnQty).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Return</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Issue Credit Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
