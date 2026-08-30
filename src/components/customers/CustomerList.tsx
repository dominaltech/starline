import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { Customer } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CustomerDetailModal } from './CustomerDetailModal';
import {
  Users,
  Search,
  UserPlus,
  Eye,
  X,
  Mic,
  Check
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const { customers, bills, saveCustomer } = useDb();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // New Customer Form State
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');

  // Inline Table Editing State
  const [inlineEdits, setInlineEdits] = useState<Record<string, Partial<Customer>>>({});
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
  const startInlineEdit = (customerId: string, field: keyof Customer, currentValue: string | number) => {
    setActiveCellId(`${customerId}_${field}`);
    setInlineEdits((prev) => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        [field]: currentValue
      }
    }));
  };

  const updateInlineEdit = (customerId: string, field: keyof Customer, value: string | number) => {
    setInlineEdits((prev) => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        [field]: value
      }
    }));
  };

  const saveInlineEdit = (customer: Customer) => {
    const edits = inlineEdits[customer.id];
    if (!edits) return;

    const updated: Customer = {
      ...customer,
      ...edits,
      updated_at: new Date().toISOString()
    };

    saveCustomer(updated);

    setInlineEdits((prev) => {
      const next = { ...prev };
      delete next[customer.id];
      return next;
    });
    setActiveCellId(null);
  };

  const cancelInlineEdit = (customerId: string) => {
    setInlineEdits((prev) => {
      const next = { ...prev };
      delete next[customerId];
      return next;
    });
    setActiveCellId(null);
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.gstin && c.gstin.toLowerCase().includes(q))
    );
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      alert('Please provide Customer Name and Mobile Number.');
      return;
    }

    const newCust: Customer = {
      id: 'cust_' + Date.now(),
      name: name.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      gstin: gstin.trim().toUpperCase(),
      state_code: '27',
      dues_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveCustomer(newCust);
    setShowAddModal(false);
    setName('');
    setMobile('');
    setAddress('');
    setGstin('');
  };

  const totalDues = customers.reduce((acc, c) => acc + c.dues_balance, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Customer Directory ({customers.length})</h2>
            <p className="text-xs text-slate-500">
              Click directly on Name, Mobile, Address, or Dues to edit inline. Press Enter or click Save.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-xs">
            <span className="text-amber-800 font-semibold">Total Outstanding Dues:</span>
            <span className="text-amber-900 font-black">{formatCurrency(totalDues)}</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Input with Voice Search */}
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search by customer name, mobile number, address, or GSTIN..."
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
          title="Voice Search (Speak customer name or phone)"
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {/* Customer Directory Table with Inline Editing */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header">
              <tr>
                <th className="py-3 px-4">Customer Name (Click to Edit)</th>
                <th className="py-3 px-3">Mobile Number</th>
                <th className="py-3 px-4">Address / Area</th>
                <th className="py-3 px-3">GSTIN (B2B)</th>
                <th className="py-3 px-3 text-center">Bills</th>
                <th className="py-3 px-4 text-right">Dues / Balance (₹)</th>
                <th className="py-3 px-3 text-center w-28">Save / Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No customers found matching your search query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const billCount = bills.filter(
                    (b) => b.customer_id === c.id || b.customer_mobile === c.mobile
                  ).length;
                  const hasEdits = !!inlineEdits[c.id];
                  const currentName = inlineEdits[c.id]?.name ?? c.name;
                  const currentMobile = inlineEdits[c.id]?.mobile ?? c.mobile;
                  const currentAddress = inlineEdits[c.id]?.address ?? c.address;
                  const currentDues = inlineEdits[c.id]?.dues_balance ?? c.dues_balance;

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${hasEdits ? 'bg-amber-50/60' : 'hover:bg-slate-50'}`}
                    >
                      {/* Customer Name */}
                      <td className="py-2 px-4">
                        {activeCellId === `${c.id}_name` ? (
                          <input
                            type="text"
                            autoFocus
                            value={currentName}
                            onChange={(e) => updateInlineEdit(c.id, 'name', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(c);
                              if (e.key === 'Escape') cancelInlineEdit(c.id);
                            }}
                            className="w-full px-2 py-1 border border-blue-900 rounded text-xs font-bold bg-white"
                          />
                        ) : (
                          <div
                            onClick={() => startInlineEdit(c.id, 'name', c.name)}
                            className="cursor-pointer group"
                            title="Click to edit name"
                          >
                            <div className="font-bold text-slate-900 group-hover:text-blue-900 group-hover:underline">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-400">Added: {formatDate(c.created_at)}</div>
                          </div>
                        )}
                      </td>

                      {/* Mobile */}
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                        {activeCellId === `${c.id}_mobile` ? (
                          <input
                            type="text"
                            autoFocus
                            value={currentMobile}
                            onChange={(e) => updateInlineEdit(c.id, 'mobile', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(c);
                              if (e.key === 'Escape') cancelInlineEdit(c.id);
                            }}
                            className="w-28 px-2 py-1 border border-blue-900 rounded text-xs font-mono font-bold bg-white"
                          />
                        ) : (
                          <div
                            onClick={() => startInlineEdit(c.id, 'mobile', c.mobile)}
                            className="cursor-pointer hover:text-blue-900 hover:underline"
                            title="Click to edit mobile"
                          >
                            {c.mobile || '-'}
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-2 px-4 text-slate-600 max-w-xs truncate">
                        {activeCellId === `${c.id}_address` ? (
                          <input
                            type="text"
                            autoFocus
                            value={currentAddress}
                            onChange={(e) => updateInlineEdit(c.id, 'address', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(c);
                              if (e.key === 'Escape') cancelInlineEdit(c.id);
                            }}
                            className="w-full px-2 py-1 border border-blue-900 rounded text-xs bg-white"
                          />
                        ) : (
                          <div
                            onClick={() => startInlineEdit(c.id, 'address', c.address || '')}
                            className="cursor-pointer hover:text-blue-900 hover:underline"
                            title="Click to edit address"
                          >
                            {c.address || '-'}
                          </div>
                        )}
                      </td>

                      {/* GSTIN */}
                      <td className="py-2 px-3">
                        {c.gstin ? (
                          <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                            {c.gstin}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Bills Count */}
                      <td className="py-2 px-3 text-center font-bold text-slate-700">
                        {billCount}
                      </td>

                      {/* Dues / Balance */}
                      <td className="py-2 px-4 text-right font-black">
                        {activeCellId === `${c.id}_dues_balance` ? (
                          <input
                            type="number"
                            autoFocus
                            min="0"
                            step="any"
                            value={currentDues}
                            onChange={(e) =>
                              updateInlineEdit(c.id, 'dues_balance', parseFloat(e.target.value) || 0)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(c);
                              if (e.key === 'Escape') cancelInlineEdit(c.id);
                            }}
                            className="w-24 text-right px-2 py-1 border border-blue-900 rounded text-xs font-bold bg-white"
                          />
                        ) : (
                          <div
                            onClick={() => startInlineEdit(c.id, 'dues_balance', c.dues_balance)}
                            className="cursor-pointer"
                            title="Click to edit dues"
                          >
                            {currentDues > 0 ? (
                              <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs inline-block">
                                ₹{currentDues.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">₹0.00 (Clear)</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Save Button & Actions */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Save Inline Edit Button */}
                          {hasEdits && (
                            <button
                              onClick={() => saveInlineEdit(c)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs animate-pulse"
                              title="Save inline changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                          )}

                          {/* View Ledger Modal */}
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="btn-secondary text-xs py-1 px-2 text-slate-700"
                            title="View Customer Ledger & Dues History"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-900" />
                            <span className="hidden sm:inline">Ledger</span>
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

      {/* Detail & Ledger Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-900" />
                <span>Create New Customer</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="10-digit mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Shop / House / Area, Solapur"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional for B2B)</label>
                <input
                  type="text"
                  placeholder="e.g. 27AAACA9593P1ZV"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="input-field font-mono uppercase"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
