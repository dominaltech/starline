import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { Section } from '../../types';
import { LayoutGrid, Plus, Trash2, Edit3, Package } from 'lucide-react';

export const RackSectionView: React.FC = () => {
  const { sections, products, saveSection, deleteSection } = useDb();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Section / Rack name is required.');
      return;
    }

    const newSec: Section = {
      id: editingSection?.id || 'sec_' + Date.now(),
      name: name.trim(),
      description: description.trim() || undefined,
      created_at: editingSection?.created_at || new Date().toISOString()
    };

    saveSection(newSec);
    setShowAddModal(false);
    setEditingSection(null);
    setName('');
    setDescription('');
  };

  const startEdit = (sec: Section) => {
    setEditingSection(sec);
    setName(sec.name);
    setDescription(sec.description || '');
    setShowAddModal(true);
  };

  const handleDelete = (sec: Section) => {
    const prodsInSection = products.filter(p => p.section_id === sec.id);
    if (prodsInSection.length > 0) {
      alert(`Cannot delete ${sec.name} because ${prodsInSection.length} products are currently assigned to it.`);
      return;
    }
    if (window.confirm(`Delete section ${sec.name}?`)) {
      deleteSection(sec.id);
    }
  };

  // Group products by section
  const unassignedProducts = products.filter(p => !p.section_id);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Physical Store Racks & Sections ({sections.length})</h2>
            <p className="text-xs text-slate-500">Pharmacy-style shelf location visualizer for instant shop locating</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingSection(null);
            setName('');
            setDescription('');
            setShowAddModal(true);
          }}
          className="btn-primary text-xs px-3.5 py-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Rack / Section</span>
        </button>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((sec) => {
          const sectionProducts = products.filter(p => p.section_id === sec.id);
          const totalStockUnits = sectionProducts.reduce((acc, p) => acc + p.stock_qty, 0);

          return (
            <div key={sec.id} className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
              {/* Rack Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                    <LayoutGrid className="w-4 h-4 text-blue-900" />
                    <span>{sec.name}</span>
                  </div>
                  {sec.description && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{sec.description}</div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(sec)}
                    className="p-1 text-slate-400 hover:text-blue-900 rounded"
                    title="Edit Rack"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sec)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Rack"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Product List in Rack */}
              <div className="p-4 flex-1 space-y-2 max-h-64 overflow-y-auto">
                {sectionProducts.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    No spares placed in this rack yet.
                  </div>
                ) : (
                  sectionProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="pr-2">
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.sku || 'No SKU'} • ₹{p.selling_price}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded shrink-0">
                        {p.stock_qty} {p.unit}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Rack Footer Summary */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-200 text-xs flex justify-between items-center text-slate-600">
                <span>{sectionProducts.length} Items</span>
                <span className="font-bold text-slate-800">{totalStockUnits} Units in Stock</span>
              </div>
            </div>
          );
        })}

        {/* Unassigned Spares Container */}
        {unassignedProducts.length > 0 && (
          <div className="bg-white rounded-lg border border-dashed border-amber-300 shadow-xs flex flex-col justify-between overflow-hidden">
            <div className="p-4 bg-amber-50/60 border-b border-amber-200 flex justify-between items-center">
              <div className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-700" />
                <span>Unassigned Spares</span>
              </div>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                {unassignedProducts.length} items
              </span>
            </div>

            <div className="p-4 flex-1 space-y-2 max-h-64 overflow-y-auto">
              {unassignedProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center p-2 rounded bg-amber-50/30 border border-amber-100 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.sku || 'No SKU'}</div>
                  </div>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {p.stock_qty} {p.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50/30 border-t border-amber-200 text-xs text-amber-800 italic">
              Edit these products to assign them to physical shelves.
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-900" />
                <span>{editingSection ? 'Edit Shelf / Rack' : 'Create Storage Shelf / Rack'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSection(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rack / Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rack A1 — AC Spares"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Location Details</label>
                <input
                  type="text"
                  placeholder="e.g. Near main counter, bottom two shelves"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSection(null);
                  }}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Save Rack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
