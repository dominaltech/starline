import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { StockCombinerModal } from './StockCombinerModal';
import { formatCurrency } from '../../utils/formatters';
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
  ShieldAlert,
  Mic,
  Check,
  X,
  Upload,
  Camera
} from 'lucide-react';

export const ProductList: React.FC = () => {
  const { products, sections, stockMovements, saveProduct, deleteProduct } = useDb();
  const { isSuperAdmin, role } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [combiningProduct, setCombiningProduct] = useState<Product | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Voice Search State
  const [isListening, setIsListening] = useState<boolean>(false);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Bulk Product Image Upload State
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkDrafts, setBulkDrafts] = useState<
    Array<{ id: string; image_data: string; name: string; selling_price: string; stock_qty: string }>
  >([]);

  // Inline Table Editing State: map productId -> edits object
  const [inlineEdits, setInlineEdits] = useState<Record<string, Partial<Product>>>({});
  const [activeCellId, setActiveCellId] = useState<string | null>(null);

  // Voice Search Handler
  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is supported in Google Chrome & Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Inline Editing Helpers
  const startInlineEdit = (productId: string, field: keyof Product, currentValue: string | number) => {
    setActiveCellId(`${productId}_${field}`);
    setInlineEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: currentValue
      }
    }));
  };

  const updateInlineEdit = (productId: string, field: keyof Product, value: string | number) => {
    setInlineEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const saveInlineEdit = (product: Product) => {
    const edits = inlineEdits[product.id];
    if (!edits) return;

    const updatedProd: Product = {
      ...product,
      ...edits,
      updated_at: new Date().toISOString()
    };

    saveProduct(updatedProd);

    // Clear editing for this product
    setInlineEdits((prev) => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
    setActiveCellId(null);
  };

  const cancelInlineEdit = (productId: string) => {
    setInlineEdits((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setActiveCellId(null);
  };

  // Quick Inline Image Upload
  const handleQuickImageUpload = (product: Product, file: File) => {
    if (file.size > 800000) {
      alert('Image must be under 800KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      saveProduct({
        ...product,
        image_data: base64,
        updated_at: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
  };

  // Bulk File Upload
  const handleBulkFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const drafts: Array<{ id: string; image_data: string; name: string; selling_price: string; stock_qty: string }> = [];
    let loadedCount = 0;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        drafts.push({
          id: 'draft_' + Date.now() + '_' + index,
          image_data: ev.target?.result as string,
          name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          selling_price: '0',
          stock_qty: '1'
        });
        loadedCount++;
        if (loadedCount === files.length) {
          setBulkDrafts(drafts);
          setShowBulkModal(true);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleSaveBulkDrafts = () => {
    bulkDrafts.forEach((draft) => {
      if (!draft.name.trim()) return;
      saveProduct({
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: draft.name.trim(),
        unit: 'NOS',
        selling_price: parseFloat(draft.selling_price) || 0,
        stock_qty: parseInt(draft.stock_qty, 10) || 0,
        image_data: draft.image_data,
        min_stock_alert: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    setShowBulkModal(false);
    setBulkDrafts([]);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedSection !== 'ALL' && p.section_id !== selectedSection) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.type && p.type.toLowerCase().includes(q)) ||
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
            <p className="text-xs text-slate-500">
              Click on Part Name, Price or Stock cells to edit directly inline. Click Save or press Enter.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Images Upload Button */}
          <label className="btn-secondary text-xs px-3 py-2 cursor-pointer inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100">
            <Upload className="w-4 h-4 text-blue-900" />
            <span>Bulk Upload Images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleBulkFilesSelect}
              className="hidden"
            />
          </label>

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

      {/* Filter & Search Bar with Voice Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative flex items-center">
          <input
            type="text"
            placeholder="Search by part name, type / model, or HSN number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 pr-10 text-xs font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={startVoiceSearch}
            className={`absolute right-2 p-1.5 rounded-md transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                : 'text-slate-400 hover:text-blue-900 hover:bg-slate-100'
            }`}
            title="Voice Search (Speak part name)"
          >
            <Mic className="w-4 h-4" />
          </button>
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

      {/* Product Catalog Table with Inline Editing */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header">
              <tr>
                <th className="py-3 px-3 w-14 text-center">Photo</th>
                <th className="py-3 px-3">Item Description (Click to Edit)</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Storage Rack</th>
                {isSuperAdmin && (
                  <th className="py-3 px-3 text-right">Buy Price (₹)</th>
                )}
                <th className="py-3 px-3 text-right">Sell Price (₹)</th>
                <th className="py-3 px-3 text-center">Stock Balance</th>
                <th className="py-3 px-3 text-center w-24">Save / Actions</th>
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
                  const section = sections.find((s) => s.id === p.section_id);
                  const isLowStock = p.stock_qty <= (p.min_stock_alert || 5);
                  const hasEdits = !!inlineEdits[p.id];
                  const currentName = inlineEdits[p.id]?.name ?? p.name;
                  const currentSellPrice = inlineEdits[p.id]?.selling_price ?? p.selling_price;
                  const currentStock = inlineEdits[p.id]?.stock_qty ?? p.stock_qty;
                  const currentBuyPrice = inlineEdits[p.id]?.buy_price ?? p.buy_price ?? 0;

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${hasEdits ? 'bg-amber-50/60' : 'hover:bg-slate-50'}`}
                    >
                      {/* Product Photo Thumbnail */}
                      <td className="py-2 px-2 text-center">
                        {p.image_data ? (
                          <img
                            src={p.image_data}
                            alt={p.name}
                            onClick={() => setPreviewImage(p.image_data!)}
                            className="w-10 h-10 object-cover rounded border border-slate-300 mx-auto cursor-pointer hover:opacity-85 shadow-2xs"
                          />
                        ) : (
                          <label className="w-10 h-10 bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-900 rounded border border-dashed border-slate-300 mx-auto flex items-center justify-center cursor-pointer transition-colors" title="Upload Photo">
                            <Camera className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleQuickImageUpload(p, file);
                              }}
                            />
                          </label>
                        )}
                      </td>

                      {/* Product Name (Inline editable) */}
                      <td className="py-2 px-3">
                        {activeCellId === `${p.id}_name` ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              value={currentName}
                              onChange={(e) => updateInlineEdit(p.id, 'name', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit(p);
                                if (e.key === 'Escape') cancelInlineEdit(p.id);
                              }}
                              className="w-full px-2 py-1 border border-blue-900 rounded text-xs font-bold focus:ring-1 focus:ring-blue-900 bg-white"
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => startInlineEdit(p.id, 'name', p.name)}
                            className="cursor-pointer group"
                            title="Click to edit name"
                          >
                            <div className="font-bold text-slate-900 group-hover:text-blue-900 group-hover:underline flex items-center gap-1">
                              <span>{p.name}</span>
                            </div>
                            <div className="text-[10.5px] text-slate-400">Unit: {p.unit}</div>
                          </div>
                        )}
                      </td>

                      {/* Product Type */}
                      <td className="py-2 px-3 font-semibold text-slate-700">
                        {p.type || p.sku || '-'}
                      </td>

                      {/* Storage Rack */}
                      <td className="py-2 px-3">
                        {section ? (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <LayoutGrid className="w-3 h-3 text-slate-400" />
                            {section.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Buy Price (Inline editable for Super Admin) */}
                      {isSuperAdmin && (
                        <td className="py-2 px-3 text-right">
                          {activeCellId === `${p.id}_buy_price` ? (
                            <input
                              type="number"
                              autoFocus
                              min="0"
                              step="any"
                              value={currentBuyPrice}
                              onChange={(e) =>
                                updateInlineEdit(p.id, 'buy_price', parseFloat(e.target.value) || 0)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit(p);
                                if (e.key === 'Escape') cancelInlineEdit(p.id);
                              }}
                              className="w-24 text-right px-2 py-1 border border-blue-900 rounded text-xs font-black bg-white"
                            />
                          ) : (
                            <div
                              onClick={() => startInlineEdit(p.id, 'buy_price', p.buy_price ?? 0)}
                              className="cursor-pointer font-bold text-blue-900 hover:text-blue-700 hover:underline px-1 py-0.5 rounded"
                              title="Click to edit buy price"
                            >
                              {p.buy_price !== undefined ? formatCurrency(currentBuyPrice) : '-'}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Selling Price (Inline editable) */}
                      <td className="py-2 px-3 text-right">
                        {activeCellId === `${p.id}_selling_price` ? (
                          <input
                            type="number"
                            autoFocus
                            min="0"
                            step="any"
                            value={currentSellPrice}
                            onChange={(e) =>
                              updateInlineEdit(p.id, 'selling_price', parseFloat(e.target.value) || 0)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(p);
                              if (e.key === 'Escape') cancelInlineEdit(p.id);
                            }}
                            className="w-24 text-right px-2 py-1 border border-blue-900 rounded text-xs font-black bg-white"
                          />
                        ) : (
                          <div
                            onClick={() => startInlineEdit(p.id, 'selling_price', p.selling_price)}
                            className="cursor-pointer font-black text-slate-900 hover:text-blue-900 hover:underline px-1 py-0.5 rounded"
                            title="Click to edit selling price"
                          >
                            {formatCurrency(currentSellPrice)}
                          </div>
                        )}
                      </td>

                      {/* Stock Balance (Inline editable) */}
                      <td className="py-2 px-3 text-center">
                        {activeCellId === `${p.id}_stock_qty` ? (
                          <input
                            type="number"
                            autoFocus
                            min="0"
                            value={currentStock}
                            onChange={(e) =>
                              updateInlineEdit(p.id, 'stock_qty', parseInt(e.target.value, 10) || 0)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(p);
                              if (e.key === 'Escape') cancelInlineEdit(p.id);
                            }}
                            className="w-16 text-center px-1 py-1 border border-blue-900 rounded text-xs font-black font-mono bg-white mx-auto"
                          />
                        ) : (
                          <div
                            onClick={() => startInlineEdit(p.id, 'stock_qty', p.stock_qty)}
                            className="cursor-pointer inline-flex items-center gap-1.5"
                            title="Click to edit stock level"
                          >
                            <span
                              className={`font-black font-mono px-2 py-0.5 rounded text-xs ${
                                currentStock <= 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {currentStock} {p.unit}
                            </span>
                            {isLowStock && (
                              <span title="Low stock alert!">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Save Column & Action Buttons */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Save Button for Inline Edits */}
                          {hasEdits && (
                            <button
                              onClick={() => saveInlineEdit(p)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs animate-pulse"
                              title="Save inline changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                          )}

                          {/* Pencil icon for full detail modal */}
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded"
                            title="Edit full product details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Combine stock button */}
                          <button
                            onClick={() => setCombiningProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded"
                            title="Combine stock batch"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-xl max-h-[85vh] bg-white p-3 rounded-lg shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Product full view" className="max-w-full max-h-[75vh] rounded object-contain mx-auto" />
          </div>
        </div>
      )}

      {/* Bulk Images Drafts Review Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-900" />
                <span>Bulk Add Products ({bulkDrafts.length} Photos Uploaded)</span>
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Each uploaded photo has been converted into an independent catalog item. Review product names, selling prices, and initial quantities before saving.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
              {bulkDrafts.map((draft, idx) => (
                <div key={draft.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <img
                    src={draft.image_data}
                    alt={draft.name}
                    className="w-full h-28 object-cover rounded border border-slate-300"
                  />
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-0.5">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBulkDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, name: val } : d))
                        );
                      }}
                      className="input-field text-xs font-semibold py-1"
                      placeholder="e.g. Copper Elbow 1/2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-600 mb-0.5">
                        Sell Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={draft.selling_price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBulkDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, selling_price: val } : d))
                          );
                        }}
                        className="input-field text-xs font-bold py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-600 mb-0.5">
                        Stock Qty
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={draft.stock_qty}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBulkDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, stock_qty: val } : d))
                          );
                        }}
                        className="input-field text-xs font-bold py-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBulkDrafts}
                className="btn-primary text-xs px-4"
              >
                <Check className="w-4 h-4" />
                <span>Save All {bulkDrafts.length} Products</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                <X className="w-5 h-5" />
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
                          {new Date(sm.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
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
