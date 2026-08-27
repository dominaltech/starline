import React, { useState } from 'react';
import { Product } from '../../types';
import { useDb } from '../../context/DbContext';
import { X, Layers, CheckCircle } from 'lucide-react';

interface StockCombinerModalProps {
  product: Product;
  onClose: () => void;
}

export const StockCombinerModal: React.FC<StockCombinerModalProps> = ({ product, onClose }) => {
  const { combineStock } = useDb();

  const [addQty, setAddQty] = useState<string>('');
  const [notes, setNotes] = useState<string>('Batch shipment received');
  const [success, setSuccess] = useState<boolean>(false);

  const handleCombine = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(addQty, 10);
    if (isNaN(qty) || qty === 0) {
      alert('Please enter a valid non-zero quantity to combine.');
      return;
    }

    combineStock(product.id, qty, notes);
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-900" />
            <span>Stock Combine / Batch Merge</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-900">{product.name}</div>
          <div className="text-slate-500 font-mono">SKU: {product.sku || 'N/A'} • Unit: {product.unit}</div>
          <div className="text-slate-700 pt-1">
            Current Stock Level: <span className="font-black text-slate-900">{product.stock_qty} {product.unit}</span>
          </div>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Stock combined successfully and recorded into ledger!</span>
          </div>
        ) : (
          <form onSubmit={handleCombine} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Additional Quantity to Merge *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 10 or 25"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                className="input-field font-bold font-mono"
              />
              <span className="text-[11px] text-slate-400">
                New Total will be: {product.stock_qty + (parseInt(addQty, 10) || 0)} {product.unit}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Batch Source / Supplier Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                Combine Stock
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
