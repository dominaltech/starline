import React, { useState } from 'react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useDb } from '../../context/DbContext';
import { X, Package, ShieldAlert, Upload, Image, Trash2 } from 'lucide-react';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, onClose }) => {
  const { isSuperAdmin } = useAuth();
  const { sections, saveProduct } = useDb();

  const [name, setName] = useState<string>(product?.name || '');
  const [sku, setSku] = useState<string>(product?.sku || '');
  const [hsnCode, setHsnCode] = useState<string>(product?.hsn_code || '84159000');
  const [unit, setUnit] = useState<string>(product?.unit || 'NOS');
  const [buyPrice, setBuyPrice] = useState<string>(
    product?.buy_price !== undefined ? String(product.buy_price) : ''
  );
  const [sellingPrice, setSellingPrice] = useState<string>(
    product?.selling_price !== undefined ? String(product.selling_price) : ''
  );
  const [stockQty, setStockQty] = useState<string>(
    product?.stock_qty !== undefined ? String(product.stock_qty) : '0'
  );
  const [sectionId, setSectionId] = useState<string>(product?.section_id || '');
  const [minStockAlert, setMinStockAlert] = useState<string>(
    product?.min_stock_alert !== undefined ? String(product.min_stock_alert) : '5'
  );
  const [imageData, setImageData] = useState<string>(product?.image_data || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800000) {
      alert('Image must be under 800KB for offline storage.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageData(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Product Name is required.');
      return;
    }

    const newProd: Product = {
      id: product?.id || 'prod_' + Date.now(),
      name: name.trim(),
      sku: sku.trim() || undefined,
      hsn_code: hsnCode.trim() || '84159000',
      unit: unit.trim() || 'NOS',
      // If Super Admin, save buy price; if Admin editing, keep existing buy_price
      buy_price: isSuperAdmin && buyPrice ? parseFloat(buyPrice) : product?.buy_price,
      selling_price: sellingPrice ? parseFloat(sellingPrice) : 0,
      stock_qty: stockQty ? parseInt(stockQty, 10) : 0,
      section_id: sectionId || undefined,
      min_stock_alert: minStockAlert ? parseInt(minStockAlert, 10) : 5,
      image_data: imageData || undefined,
      created_at: product?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveProduct(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-900" />
            <span>{product ? 'Edit Spare / Product' : 'Add New Spare / Product'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product / Spare Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rotary Compressor 1.5 Ton R32"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU / Item Code</label>
              <input
                type="text"
                placeholder="e.g. CMP-15-R32"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">HSN Code (GST)</label>
              <input
                type="text"
                placeholder="e.g. 84143000"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input-field cursor-pointer font-medium"
              >
                <option value="NOS">NOS (Numbers)</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="SET">SET (Set of Parts)</option>
                <option value="QTL">QTL (Quintal)</option>
                <option value="MTR">MTR (Meters)</option>
                <option value="SERVICE">SERVICE (Service / Labor Catalog)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Physical Rack / Section</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="input-field cursor-pointer font-medium"
              >
                <option value="">-- Unassigned --</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Image Upload */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label className="block font-semibold text-slate-700">Product / Part Image</label>
            <div className="flex items-center gap-3">
              {imageData ? (
                <div className="relative group">
                  <img
                    src={imageData}
                    alt="Product preview"
                    className="w-16 h-16 object-cover rounded-md border border-slate-300 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setImageData('')}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs"
                    title="Remove Image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-white rounded-md border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <Image className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px]">No photo</span>
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
                />
                <span className="text-[10.5px] text-slate-400 mt-1 block">
                  PNG/JPG up to 800KB. Stored offline with product.
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Row - RBAC Protected */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
            {isSuperAdmin ? (
              <div>
                <label className="block font-semibold text-blue-900 mb-1 flex items-center gap-1">
                  <span>Buy Price (Cost ₹)</span>
                  <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded">Super Admin</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Cost Price"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="input-field font-bold text-blue-900 bg-blue-50/40"
                />
              </div>
            ) : (
              <div className="flex items-center text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded border border-slate-200">
                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                <span>Buy Price hidden for Admin role</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="Customer Price"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="input-field font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Inventory & Stock Alert */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Stock Qty</label>
              <input
                type="number"
                min="0"
                placeholder="Quantity"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="input-field font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Low-Stock Alert Level</label>
              <input
                type="number"
                min="1"
                placeholder="Alert Level"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="input-field font-mono"
              />
            </div>
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
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
