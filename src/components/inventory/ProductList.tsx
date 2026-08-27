import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { StockCombinerModal } from './StockCombinerModal';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Layers,
  AlertTriangle,
  LayoutGrid,
  History,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export const ProductList: React.FC = () => {
  const { products, sections, stockMovements, deleteProduct } = useDb();
  const { isSuperAdmin, role } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [combiningProduct, setCombiningProduct] = useState<Product | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const filteredProducts = products.filter((p) => {
    if (selectedSection !== 'ALL' && p.section_id !== selectedSection) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.hsn_code && p.hsn_code.includes(q))
    );
  });

  const handleDelete = (prod: Product) => {
    const confirm = window.confirm(`Are you sure you want to delete ${prod.name}?`);
    if (confirm) {
      deleteProduct(prod.id);
    }
  };

  const lowStockCount = products.filter(p => p.stock_qty <= (p.min_stock_alert || 5)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Inventory & Spares Catalog ({products.length})</h2>
              {role === 'admin' ? (
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-slate-400" /> Cost Hidden (Admin)
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-900 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-900" /> Full Cost & Profit Access
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Universal parts catalog, physical rack locations, and stock combination</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="btn-secondary text-xs px-3 py-2"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Stock Ledger</span>
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Spare Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="Search by part name, SKU / code, or HSN number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="input-field text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Storage Racks ({sections.length})</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Catalog Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header">
              <tr>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-3">SKU / Code</th>
                <th className="py-3 px-3">HSN Code</th>
                <th className="py-3 px-3">Storage Rack</th>
                {isSuperAdmin && (
                  <th className="py-3 px-3 text-right">Buy Price (₹)</th>
                )}
                <th className="py-3 px-3 text-right">Sell Price (₹)</th>
                <th className="py-3 px-3 text-center">Stock Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="py-8 text-center text-slate-400 italic">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const section = sections.find(s => s.id === p.section_id);
                  const isLowStock = p.stock_qty <= (p.min_stock_alert || 5);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-400">Unit: {p.unit}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 font-medium">
                        {p.sku || '-'}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {p.hsn_code || '-'}
                      </td>

                      <td className="py-3 px-3">
                        {section ? (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <LayoutGrid className="w-3 h-3 text-slate-400" />
                            {section.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {isSuperAdmin && (
                        <td className="py-3 px-3 text-right font-bold text-blue-900">
                          {p.buy_price !== undefined ? `₹${p.buy_price.toFixed(2)}` : '-'}
                        </td>
                      )}

                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        ₹{p.selling_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`font-black font-mono px-2 py-0.5 rounded text-xs ${
                              p.stock_qty <= 0
                                ? 'bg-rose-100 text-rose-800'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {p.stock_qty} {p.unit}
                          </span>
                          {isLowStock && (
                            <span title="Low stock alert!">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => setCombiningProduct(p)}
                            className="btn-secondary text-[11px] py-1 px-2 text-slate-700"
                            title="Combine stock batch"
                          >
                            <Layers className="w-3 h-3 text-blue-900" />
                            <span>Combine</span>
                          </button>

                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add / Edit Modal */}
      {(isCreating || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setIsCreating(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Stock Combine Modal */}
      {combiningProduct && (
        <StockCombinerModal
          product={combiningProduct}
          onClose={() => setCombiningProduct(null)}
        />
      )}

      {/* Stock Movement Audit Log Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-900" />
                <span>Stock Movement & Audit Ledger</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded">
              <table className="w-full text-xs text-left">
                <thead className="table-header">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-2 text-center">Type</th>
                    <th className="py-2 px-2 text-right">Change</th>
                    <th className="py-2 px-2 text-right">Balance</th>
                    <th className="py-2 px-3">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                        No stock movement events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    stockMovements.map((sm) => (
                      <tr key={sm.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(sm.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{sm.product_name}</td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              sm.type === 'SALE'
                                ? 'bg-rose-100 text-rose-800'
                                : sm.type === 'RETURN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {sm.type}
                          </span>
                        </td>
                        <td
                          className={`py-2 px-2 text-right font-black font-mono ${
                            sm.change_qty > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {sm.change_qty > 0 ? `+${sm.change_qty}` : sm.change_qty}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                          {sm.new_balance}
                        </td>
                        <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{sm.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button onClick={() => setShowHistoryModal(false)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
