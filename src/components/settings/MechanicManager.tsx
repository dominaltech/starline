import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { Mechanic } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Plus,
  Edit2,
  Phone,
  Wrench,
  Search,
  Building,
  MapPin,
  Trash2,
  UserCheck,
  AlertTriangle,
  Users
} from 'lucide-react';

export const MechanicManager: React.FC = () => {
  const { mechanics, saveMechanic, deleteMechanic } = useDb();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [workshopName, setWorkshopName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [duesBalance, setDuesBalance] = useState<string>('0');

  const openAddModal = () => {
    setEditingMechanic(null);
    setName('');
    setPhone('');
    setWorkshopName('');
    setAddress('');
    setDuesBalance('0');
    setShowModal(true);
  };

  const openEditModal = (m: Mechanic) => {
    setEditingMechanic(m);
    setName(m.name);
    setPhone(m.phone);
    setWorkshopName(m.workshop_name || '');
    setAddress(m.address || '');
    setDuesBalance(String(m.dues_balance || 0));
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Mechanic name is required.');
      return;
    }

    const mechanic: Mechanic = {
      id: editingMechanic?.id || 'mech_' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      workshop_name: workshopName.trim(),
      address: address.trim(),
      dues_balance: parseFloat(duesBalance) || 0,
      is_active: editingMechanic ? editingMechanic.is_active : true,
      created_at: editingMechanic?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveMechanic(mechanic);
    setShowModal(false);
    setEditingMechanic(null);
  };

  const toggleActive = (m: Mechanic) => {
    saveMechanic({
      ...m,
      is_active: !m.is_active
    });
  };

  const handleDelete = (m: Mechanic) => {
    const confirm = window.confirm(
      `Are you sure you want to delete mechanic "${m.name}"? This cannot be undone.`
    );
    if (confirm) {
      deleteMechanic(m.id);
    }
  };

  const filteredMechanics = mechanics.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.workshop_name && m.workshop_name.toLowerCase().includes(q)) ||
      (m.address && m.address.toLowerCase().includes(q))
    );
  });

  const totalDues = mechanics.reduce((sum, m) => sum + (m.dues_balance || 0), 0);
  const activeCount = mechanics.filter((m) => m.is_active).length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              B2B Mechanics &amp; Trade Technicians
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage external mechanics and technicians who buy parts at trade rates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <span>Total: <strong>{mechanics.length}</strong></span>
            <span className="mx-1.5">•</span>
            <span className="text-emerald-700 font-bold">{activeCount} Active</span>
            {totalDues > 0 && (
              <>
                <span className="mx-1.5">•</span>
                <span className="text-amber-700 font-bold">Udhar: {formatCurrency(totalDues)}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary text-xs px-3 py-1.5 shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Mechanic</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search mechanics by name, phone, workshop, or area..."
          className="input-field text-xs pl-9 py-2"
        />
      </div>

      {/* Mechanics Grid */}
      {filteredMechanics.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
          No mechanics found matching your search. Click &quot;Add Mechanic&quot; to register a new trade mechanic.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMechanics.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                m.is_active
                  ? 'bg-slate-50/80 border-slate-200 hover:border-indigo-300'
                  : 'bg-slate-100/60 border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-1">
                  <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                  <button
                    type="button"
                    onClick={() => toggleActive(m)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer shrink-0 ${
                      m.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {m.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {m.workshop_name && (
                  <div className="text-slate-600 font-medium flex items-center gap-1.5 mt-1">
                    <Building className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{m.workshop_name}</span>
                  </div>
                )}

                <div className="text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{m.phone || 'No phone'}</span>
                </div>

                {m.address && (
                  <div className="text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{m.address}</span>
                  </div>
                )}
              </div>

              {/* Footer: Udhar Dues & Actions */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between items-center">
                <div>
                  {m.dues_balance > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Udhar: {formatCurrency(m.dues_balance)}</span>
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      ✓ No Dues
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(m)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-white transition-colors cursor-pointer"
                    title="Edit Mechanic"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-white transition-colors cursor-pointer"
                    title="Delete Mechanic"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Mechanic Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>{editingMechanic ? 'Edit Mechanic Details' : 'Register New B2B Mechanic'}</span>
            </h4>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mechanic Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Santosh Jadhav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workshop / Garage Name</label>
                <input
                  type="text"
                  placeholder="e.g. Santosh AC &amp; Fridge Care"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workshop Area / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Near Saat Rasta, Solapur"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Opening Udhar / Dues Balance (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={duesBalance}
                  onChange={(e) => setDuesBalance(e.target.value)}
                  placeholder="0"
                  className="input-field font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Any previous pending credit/udhar amount owed by this mechanic
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                  {editingMechanic ? 'Update Mechanic' : 'Save Mechanic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
