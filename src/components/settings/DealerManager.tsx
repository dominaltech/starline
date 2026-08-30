import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { DealerContact } from '../../types';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  Phone,
  MessageCircle,
  Store
} from 'lucide-react';

export const DealerManager: React.FC = () => {
  const { settings, saveSettings } = useDb();
  const [dealers, setDealers] = useState<DealerContact[]>(settings.dealers || []);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingDealer, setEditingDealer] = useState<DealerContact | null>(null);

  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');

  const openAddModal = () => {
    setEditingDealer(null);
    setName('');
    setPhone('');
    setSpecialization('');
    setShowModal(true);
  };

  const openEditModal = (dealer: DealerContact) => {
    setEditingDealer(dealer);
    setName(dealer.name);
    setPhone(dealer.phone);
    setSpecialization(dealer.specialization || '');
    setShowModal(true);
  };

  const handleSaveDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please enter Dealer Name and WhatsApp Mobile Number.');
      return;
    }

    let updatedList: DealerContact[];

    if (editingDealer) {
      updatedList = dealers.map((d) =>
        d.id === editingDealer.id
          ? {
              ...d,
              name: name.trim(),
              phone: phone.trim().replace(/\D/g, '').slice(-10),
              specialization: specialization.trim()
            }
          : d
      );
    } else {
      const newDealer: DealerContact = {
        id: 'dlr_' + Date.now(),
        name: name.trim(),
        phone: phone.trim().replace(/\D/g, '').slice(-10),
        specialization: specialization.trim(),
        is_active: true,
        created_at: new Date().toISOString()
      };
      updatedList = [...dealers, newDealer];
    }

    setDealers(updatedList);
    saveSettings({
      ...settings,
      dealers: updatedList
    });

    setShowModal(false);
  };

  const handleDeleteDealer = (id: string) => {
    const confirm = window.confirm('Are you sure you want to remove this dealer contact?');
    if (!confirm) return;

    const updatedList = dealers.filter((d) => d.id !== id);
    setDealers(updatedList);
    saveSettings({
      ...settings,
      dealers: updatedList
    });
  };

  const handleToggleActive = (dealer: DealerContact) => {
    const updatedList = dealers.map((d) =>
      d.id === dealer.id ? { ...d, is_active: !d.is_active } : d
    );
    setDealers(updatedList);
    saveSettings({
      ...settings,
      dealers: updatedList
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Wholesale Dealers & Spares Suppliers ({dealers.length})
            </h3>
            <p className="text-xs text-slate-500">
              Manage parts supplier WhatsApp contacts for one-click order dispatch from Notes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary text-xs px-3 py-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier / Dealer</span>
        </button>
      </div>

      {/* Dealers Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left">
          <thead className="table-header">
            <tr>
              <th className="py-2.5 px-3">Dealer / Shop Name</th>
              <th className="py-2.5 px-3">WhatsApp Number</th>
              <th className="py-2.5 px-3">Supply Parts / Category</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {dealers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                  No dealer contacts added yet. Click &quot;Add Supplier / Dealer&quot; to configure.
                </td>
              </tr>
            ) : (
              dealers.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-blue-900" />
                      <span>{dealer.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+91 {dealer.phone}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {dealer.specialization || 'Universal Spares'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(dealer)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        dealer.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {dealer.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(dealer)}
                        className="p-1 text-slate-500 hover:text-blue-900 rounded"
                        title="Edit Dealer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDealer(dealer.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Dealer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Dealer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-900" />
                <span>{editingDealer ? 'Edit Dealer Contact' : 'Add New Spares Dealer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDealer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dealer / Wholesaler Enterprise Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Balaji Refrigeration Spares Wholesale"
                  className="input-field font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  10-Digit WhatsApp Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9822012345"
                  className="input-field font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Parts Category / Specialization
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Compressors, Gas Cylinders, Copper Pipes"
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Dealer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
