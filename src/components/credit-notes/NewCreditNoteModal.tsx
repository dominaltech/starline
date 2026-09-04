import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { CreditNote } from '../../types';
import { formatDateInput } from '../../utils/formatters';
import { X, RotateCcw } from 'lucide-react';

interface NewCreditNoteModalProps {
  onClose: () => void;
}

interface NormalizedReturnItem {
  id: string;
  product_id?: string;
  description: string;
  qty: number;
  rate: number;
  tax_rate: number;
}

export const NewCreditNoteModal: React.FC<NewCreditNoteModalProps> = ({ onClose }) => {
  const { bills, b2bBills, settings, createCreditNote } = useDb();

  const [selectedKey, setSelectedKey] = useState<string>('');
  const [noteNum, setNoteNum] = useState<string>(`CN-${settings.starting_credit_note_num || 101}`);
  const [noteDate, setNoteDate] = useState<string>(formatDateInput());
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [reason, setReason] = useState<string>('Defective part replaced / Customer return');

  // Resolve bill metadata
  let activeBill: {
    id: string;
    invoice_num: string;
    partyName: string;
    partyId?: string;
    gstin?: string;
    isB2B: boolean;
    items: NormalizedReturnItem[];
  } | null = null;

  if (selectedKey.startsWith('retail_')) {
    const id = selectedKey.replace('retail_', '');
    const b = bills.find(bill => bill.id === id);
    if (b) {
      activeBill = {
        id: b.id,
        invoice_num: b.invoice_num,
        partyName: b.customer_name,
        partyId: b.customer_id,
        gstin: b.customer_gstin,
        isB2B: false,
        items: b.items.map(it => ({
          id: it.id,
          product_id: it.product_id,
          description: it.item_description,
          qty: it.qty,
          rate: it.rate || (it.amount / (it.qty || 1)),
          tax_rate: it.tax_rate || (b.bill_type === 'GST' ? 18 : 0)
        }))
      };
    }
  } else if (selectedKey.startsWith('b2b_')) {
    const id = selectedKey.replace('b2b_', '');
    const b = b2bBills.find(bill => bill.id === id);
    if (b) {
      activeBill = {
        id: b.id,
        invoice_num: b.invoice_num,
        partyName: b.mechanic_name || b.customer_name || 'Mechanic',
        partyId: b.mechanic_id,
        gstin: undefined,
        isB2B: true,
        items: b.items.map(it => ({
          id: it.id,
          product_id: it.product_id,
          description: it.product_name,
          qty: it.qty,
          rate: it.price || (it.total / (it.qty || 1)),
          tax_rate: 0
        }))
      };
    }
  }

  const selectedItem = activeBill?.items.find(i => i.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBill || !selectedItem) {
      alert('Please select an invoice and a line item to return.');
      return;
    }

    const rate = selectedItem.rate;
    const taxable = Math.round(rate * returnQty * 100) / 100;
    const taxRate = selectedItem.tax_rate;
    const halfTax = taxRate / 2;
    const cgst = Math.round(((taxable * halfTax) / 100) * 100) / 100;
    const sgst = Math.round(((taxable * halfTax) / 100) * 100) / 100;
    const total = Math.round((taxable + cgst + sgst) * 100) / 100;

    const newNote: Omit<CreditNote, 'id' | 'created_at'> = {
      note_num: noteNum.trim(),
      note_date: noteDate,
      original_bill_id: activeBill.id,
      original_invoice_num: activeBill.invoice_num,
      customer_id: activeBill.partyId,
      customer_name: activeBill.partyName,
      customer_gstin: activeBill.gstin,
      note_type: 'C',
      reason: reason.trim(),
      product_id: selectedItem.product_id,
      item_description: selectedItem.description,
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
            <label className="block font-semibold text-slate-700 mb-1">Select Original Invoice or B2B Bill *</label>
            <select
              value={selectedKey}
              onChange={(e) => {
                setSelectedKey(e.target.value);
                setSelectedItemId('');
              }}
              required
              className="input-field cursor-pointer font-medium"
            >
              <option value="">-- Choose Invoice or B2B Bill --</option>
              <optgroup label="Retail Invoices">
                {bills.filter(b => !b.is_cancelled).map((b) => (
                  <option key={`retail_${b.id}`} value={`retail_${b.id}`}>
                    Invoice #{b.invoice_num} — {b.customer_name} (₹{b.grand_total})
                  </option>
                ))}
              </optgroup>
              <optgroup label="B2B Mechanic Trade Bills">
                {b2bBills.map((b) => (
                  <option key={`b2b_${b.id}`} value={`b2b_${b.id}`}>
                    B2B #{b.invoice_num} — {b.mechanic_name || b.customer_name || 'Mechanic'} (₹{b.total_amount})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {activeBill && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Returned Spare Item *</label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  const it = activeBill.items.find(i => i.id === e.target.value);
                  if (it) setReturnQty(it.qty);
                }}
                required
                className="input-field cursor-pointer"
              >
                <option value="">-- Choose Item from {activeBill.isB2B ? 'B2B Bill' : 'Invoice'} --</option>
                {activeBill.items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.description} (Sold Qty: {it.qty}, Rate: ₹{it.rate})
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
                  ₹{(selectedItem.rate * returnQty).toFixed(2)}
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
