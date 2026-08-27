import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { Plus, Edit2, Phone, Wrench } from 'lucide-react';

export const WorkerManager: React.FC = () => {
  const { workers, saveWorker } = useDb();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Technician name is required.');
      return;
    }

    const worker: Worker = {
      id: editingWorker?.id || 'wrk_' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      specialization: specialization.trim() || 'General Appliances Tech',
      is_active: editingWorker ? editingWorker.is_active : true,
      created_at: editingWorker?.created_at || new Date().toISOString()
    };

    saveWorker(worker);
    setShowModal(false);
    setEditingWorker(null);
    setName('');
    setPhone('');
    setSpecialization('');
  };

  const toggleActive = (w: Worker) => {
    saveWorker({
      ...w,
      is_active: !w.is_active
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-900" />
          <h3 className="text-sm font-bold text-slate-900">Assigned Technicians & Field Workers</h3>
        </div>

        <button
          onClick={() => {
            setEditingWorker(null);
            setName('');
            setPhone('');
            setSpecialization('');
            setShowModal(true);
          }}
          className="btn-primary text-xs px-3 py-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Technician</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workers.map((w) => (
          <div
            key={w.id}
            className={`p-4 rounded-lg border text-xs flex justify-between items-start transition-all ${
              w.is_active ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="font-bold text-slate-900 text-sm">{w.name}</div>
              <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                <span>{w.phone || 'No phone'}</span>
              </div>
              <div className="text-blue-900 font-medium mt-1">{w.specialization}</div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => toggleActive(w)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                  w.is_active
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {w.is_active ? 'Active' : 'Inactive'}
              </button>

              <button
                onClick={() => {
                  setEditingWorker(w);
                  setName(w.name);
                  setPhone(w.phone);
                  setSpecialization(w.specialization || '');
                  setShowModal(true);
                }}
                className="text-slate-400 hover:text-blue-900"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              {editingWorker ? 'Edit Technician' : 'Add New Technician'}
            </h4>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technician Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Shinde"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skill Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. AC / Inverter / Microwave Repair"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Save Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
