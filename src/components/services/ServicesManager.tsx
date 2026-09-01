import React, { useState, useEffect } from 'react';
import { useDb } from '../../context/DbContext';
import { Customer, Product, ServiceRecord, ServiceStatus } from '../../types';
import { formatDate, formatDateInput, formatCurrency } from '../../utils/formatters';
import { SearchableCombobox, ComboboxOption } from '../common/SearchableCombobox';
import { WhatsAppModal } from '../common/WhatsAppModal';
import { interpolateTemplate } from '../../utils/whatsapp';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Search,
  X,
  MessageCircle,
  Phone,
  Globe,
  Mic
} from 'lucide-react';

export const ServicesManager: React.FC = () => {
  const {
    serviceRecords,
    customers,
    products,
    workers,
    settings,
    saveServiceRecord,
    deleteServiceRecord
  } = useDb();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | ServiceStatus>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);

  // Form Fields
  const [custName, setCustName] = useState<string>('');
  const [custMobile, setCustMobile] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('');
  const [serviceDesc, setServiceDesc] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [serviceDate, setServiceDate] = useState<string>(formatDateInput());
  const [status, setStatus] = useState<ServiceStatus>('NOT_STARTED');
  const [serviceNotes, setServiceNotes] = useState<string>('');
  const [assignedWorkerId, setAssignedWorkerId] = useState<string>('');

  // Autocomplete States
  // WhatsApp Language Preference
  const [waLanguage, setWaLanguage] = useState<'mr' | 'hi' | 'en'>('mr');
  const [waModalData, setWaModalData] = useState<{
    isOpen: boolean;
    name: string;
    phone: string;
    message: string;
  } | null>(null);

  // Voice Search for Service Modal
  const [isListeningCust, setIsListeningCust] = useState<boolean>(false);

  // Options for Searchable Comboboxes (shows all entries on dropdown chevron click!)
  const customerOptions = React.useMemo<ComboboxOption[]>(() => {
    return customers.map((c) => ({
      id: c.id,
      label: c.name,
      subLabel: c.mobile ? `Mobile: ${c.mobile}${c.address ? ` | ${c.address}` : ''}` : c.address,
      badge: c.dues_balance > 0 ? `Dues: ₹${c.dues_balance}` : undefined,
      badgeColor: c.dues_balance > 0 ? 'bg-amber-100 text-amber-900' : undefined,
      data: c
    }));
  }, [customers]);

  const serviceOptions = React.useMemo<ComboboxOption[]>(() => {
    return products.map((p) => ({
      id: p.id,
      label: p.name,
      subLabel: p.unit === 'SERVICE' ? 'Service / Labor' : `Spare Part (Stock: ${p.stock_qty} ${p.unit})`,
      badge: `₹${p.selling_price}`,
      badgeColor: p.unit === 'SERVICE' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700',
      data: p
    }));
  }, [products]);

  const workerOptions = React.useMemo<ComboboxOption[]>(() => {
    return [
      { id: '', label: 'Unassigned', subLabel: 'No technician assigned yet' },
      ...workers.filter(w => w.is_active).map((w) => ({
        id: w.id,
        label: w.name,
        subLabel: w.specialization ? `${w.specialization} (${w.phone})` : w.phone,
        badge: 'Tech',
        data: w
      }))
    ];
  }, [workers]);

  const assignedWorkerName = workers.find(w => w.id === assignedWorkerId)?.name || '';

  const selectCustomer = (c: Customer) => {
    setCustName(c.name);
    setCustMobile(c.mobile);
  };

  const selectService = (p: Product) => {
    setServiceName(p.name);
    if (p.selling_price) {
      setPrice(String(p.selling_price));
    }
  };

  // Voice Search for Customer in Modal
  const startCustomerVoiceSearch = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is supported in Chrome & Edge browsers.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;

      setIsListeningCust(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCustName(transcript);
        setIsListeningCust(false);
      };

      recognition.onerror = () => setIsListeningCust(false);
      recognition.onend = () => setIsListeningCust(false);

      recognition.start();
    } catch {
      setIsListeningCust(false);
    }
  };

  // Open Modal Helpers
  const openAddModal = () => {
    setEditingRecord(null);
    setCustName('');
    setCustMobile('');
    setServiceName('');
    setServiceDesc('');
    setPrice('');
    setServiceDate(formatDateInput());
    setStatus('NOT_STARTED');
    setServiceNotes('');
    setAssignedWorkerId('');
    setShowModal(true);
  };

  const openEditModal = (r: ServiceRecord) => {
    setEditingRecord(r);
    setCustName(r.customer_name);
    setCustMobile(r.customer_mobile);
    setServiceName(r.service_name);
    setServiceDesc(r.service_description || '');
    setPrice(String(r.price));
    setServiceDate(r.service_date);
    setStatus(r.status);
    setServiceNotes(r.notes || '');
    setAssignedWorkerId(r.assigned_worker_id || '');
    setShowModal(true);
  };

  // Save Service Record
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !serviceName.trim()) {
      alert('Please provide Customer Name and Service Name.');
      return;
    }

    const worker = workers.find((w) => w.id === assignedWorkerId);

    const record: ServiceRecord = {
      id: editingRecord?.id || 'svc_' + Date.now(),
      customer_name: custName.trim(),
      customer_mobile: custMobile.trim(),
      service_name: serviceName.trim(),
      service_description: serviceDesc.trim(),
      price: parseFloat(price) || 0,
      service_date: serviceDate,
      status,
      notes: serviceNotes.trim(),
      assigned_worker_id: assignedWorkerId || undefined,
      assigned_worker_name: worker ? worker.name : undefined,
      created_at: editingRecord?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveServiceRecord(record);
    setShowModal(false);
  };

  // Delete Record
  const handleDelete = (id: string, name: string) => {
    const confirm = window.confirm(`Delete service job record for ${name}?`);
    if (confirm) {
      deleteServiceRecord(id);
    }
  };

  // Quick Status Toggle in Table
  const handleStatusToggle = (r: ServiceRecord) => {
    const nextStatus: Record<ServiceStatus, ServiceStatus> = {
      NOT_STARTED: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      DONE: 'NOT_STARTED'
    };
    saveServiceRecord({
      ...r,
      status: nextStatus[r.status],
      updated_at: new Date().toISOString()
    });
  };

  // WhatsApp Message Generator using configurable templates from Settings
  const buildServiceWhatsAppMessage = (r: ServiceRecord, lang: 'mr' | 'hi' | 'en'): string => {
    const statusText = {
      mr: {
        NOT_STARTED: 'सुरू नाही (Not Started)',
        IN_PROGRESS: 'प्रगतीत आहे (In Progress)',
        DONE: 'पूर्ण झाले (Completed)'
      },
      hi: {
        NOT_STARTED: 'प्रारंभ नहीं (Not Started)',
        IN_PROGRESS: 'कार्य प्रगति पर है (In Progress)',
        DONE: 'पूर्ण हो चुका है (Completed)'
      },
      en: {
        NOT_STARTED: 'Not Started',
        IN_PROGRESS: 'In Progress',
        DONE: 'Completed'
      }
    };

    let template = settings.msg_template_service_en || '';
    if (lang === 'mr') {
      template = settings.msg_template_service_mr || template;
    } else if (lang === 'hi') {
      template = settings.msg_template_service_hi || template;
    }

    const serviceDescLine = r.service_description ? `तपशील / Details: ${r.service_description}\n` : '';
    const technicianLine = r.assigned_worker_name ? `तंत्रज्ञ / Technician: ${r.assigned_worker_name}\n` : '';
    const notesLine = r.notes ? `शेरा / Note: ${r.notes}\n` : '';

    return interpolateTemplate(template, {
      shop_name: settings.shop_name,
      mobiles: settings.mobiles,
      customer_name: r.customer_name,
      service_date: formatDate(r.service_date),
      service_name: r.service_name,
      service_desc_line: serviceDescLine,
      price: r.price.toFixed(2),
      status: statusText[lang][r.status],
      technician_line: technicianLine,
      notes_line: notesLine
    });
  };

  const handleSendWhatsApp = (r: ServiceRecord) => {
    const msg = buildServiceWhatsAppMessage(r, waLanguage);
    setWaModalData({
      isOpen: true,
      name: r.customer_name,
      phone: r.customer_mobile,
      message: msg
    });
  };

  // Filtered List
  const filteredRecords = serviceRecords.filter((r) => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.customer_name.toLowerCase().includes(q) ||
      r.service_name.toLowerCase().includes(q) ||
      r.customer_mobile.includes(q) ||
      (r.assigned_worker_name && r.assigned_worker_name.toLowerCase().includes(q))
    );
  });

  // Counters
  const completedCount = serviceRecords.filter((r) => r.status === 'DONE').length;
  const inProgressCount = serviceRecords.filter((r) => r.status === 'IN_PROGRESS').length;
  const notStartedCount = serviceRecords.filter((r) => r.status === 'NOT_STARTED').length;
  const totalServiceRevenue = serviceRecords.reduce((sum, r) => sum + r.price, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner & Action */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Services & Repair Operations CRM</h2>
            <p className="text-xs text-slate-500">
              Track home visit AC/Fridge repairs, servicing jobs, technician assignments, and WhatsApp alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-blue-900" />
            <button
              onClick={() => setWaLanguage('mr')}
              className={`px-2 py-0.5 rounded font-bold ${
                waLanguage === 'mr' ? 'bg-[#0F2942] text-white' : 'text-slate-600'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setWaLanguage('hi')}
              className={`px-2 py-0.5 rounded font-bold ${
                waLanguage === 'hi' ? 'bg-[#0F2942] text-white' : 'text-slate-600'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setWaLanguage('en')}
              className={`px-2 py-0.5 rounded font-bold ${
                waLanguage === 'en' ? 'bg-[#0F2942] text-white' : 'text-slate-600'
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service Record</span>
          </button>
        </div>
      </div>

      {/* KPI Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 bg-white border-l-4 border-l-blue-900">
          <div className="text-[11px] font-semibold text-slate-500">Total Services</div>
          <div className="text-xl font-black text-slate-900 mt-1">{serviceRecords.length}</div>
        </div>

        <div className="card p-3.5 bg-white border-l-4 border-l-emerald-600">
          <div className="text-[11px] font-semibold text-slate-500">Completed (Done)</div>
          <div className="text-xl font-black text-emerald-800 mt-1">{completedCount}</div>
        </div>

        <div className="card p-3.5 bg-white border-l-4 border-l-amber-500">
          <div className="text-[11px] font-semibold text-slate-500">In Progress</div>
          <div className="text-xl font-black text-amber-800 mt-1">{inProgressCount}</div>
        </div>

        <div className="card p-3.5 bg-white border-l-4 border-l-slate-400">
          <div className="text-[11px] font-semibold text-slate-500">Total Service Value</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(totalServiceRevenue)}
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="Search service name, customer name, phone number, or mechanic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 text-xs font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'ALL' | ServiceStatus)}
            className="input-field text-xs font-bold cursor-pointer"
          >
            <option value="ALL">All Statuses ({serviceRecords.length})</option>
            <option value="NOT_STARTED">Not Started ({notStartedCount})</option>
            <option value="IN_PROGRESS">In Progress ({inProgressCount})</option>
            <option value="DONE">Done / Completed ({completedCount})</option>
          </select>
        </div>
      </div>

      {/* Service Records Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Customer & Contact</th>
                <th className="py-2.5 px-3">Service / Repair Item</th>
                <th className="py-2.5 px-3 text-right">Price (₹)</th>
                <th className="py-2.5 px-3 text-center">Status (Click to toggle)</th>
                <th className="py-2.5 px-3">Technician</th>
                <th className="py-2.5 px-3 text-right">WhatsApp / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No service records found. Click &quot;Add Service Record&quot; to log a repair job.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {formatDate(r.service_date)}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{r.customer_name}</div>
                      <div className="text-[10.5px] font-mono text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{r.customer_mobile || '-'}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-blue-900">{r.service_name}</div>
                      {r.service_description && (
                        <div className="text-[11px] text-slate-500">{r.service_description}</div>
                      )}
                      {r.notes && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">Note: {r.notes}</div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(r.price)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(r)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded border shadow-2xs transition-transform active:scale-95 cursor-pointer ${
                          r.status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : r.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title="Click to toggle status"
                      >
                        {r.status === 'DONE'
                          ? '✓ Done'
                          : r.status === 'IN_PROGRESS'
                          ? '⏳ In Progress'
                          : '○ Not Started'}
                      </button>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {r.assigned_worker_name || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {/* WhatsApp Trigger Button */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(r)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                          title="Send formatted service details & price via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          className="p-1.5 text-slate-500 hover:text-blue-900 rounded hover:bg-slate-100"
                          title="Edit Service Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(r.id, r.service_name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Delete Record"
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
      </div>

      {/* Add / Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-900" />
                <span>{editingRecord ? 'Edit Service Job' : 'Add New Service Job Record'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              {/* Customer Selection Row with Voice Search & Dropdown Chevron */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="block font-semibold text-slate-700">Customer Details *</label>
                <div className="grid grid-cols-2 gap-2">
                  <SearchableCombobox
                    value={custName}
                    onChange={setCustName}
                    onSelectOption={(opt) => {
                      if (opt.data) selectCustomer(opt.data);
                    }}
                    options={customerOptions}
                    onVoiceClick={startCustomerVoiceSearch}
                    isListening={isListeningCust}
                    placeholder="Customer Name or click ▼..."
                    inputClassName="font-semibold"
                  />

                  <div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={custMobile}
                      onChange={(e) => setCustMobile(e.target.value)}
                      placeholder="10-Digit Mobile"
                      className="input-field font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Service Name (with Product & Service Catalog Combobox) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Service / Repair Work *
                </label>
                <SearchableCombobox
                  value={serviceName}
                  onChange={setServiceName}
                  onSelectOption={(opt) => {
                    if (opt.data) selectService(opt.data);
                  }}
                  options={serviceOptions}
                  placeholder="e.g. AC Gas Charging or click ▼ for all..."
                  inputClassName="font-bold"
                />
              </div>

              {/* Service Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Service Details / Scope of Work
                </label>
                <input
                  type="text"
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="e.g. Cleaned coils, vacuumed, charged 450g R32 gas"
                  className="input-field"
                />
              </div>

              {/* Price & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Charge amount"
                    className="input-field font-black"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Date</label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="input-field font-semibold"
                  />
                </div>
              </div>

              {/* Status & Assigned Technician */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                    className="input-field font-bold cursor-pointer"
                  >
                    <option value="NOT_STARTED">Not Started (सुरू नाही)</option>
                    <option value="IN_PROGRESS">In Progress (काम चालू)</option>
                    <option value="DONE">Done (काम पूर्ण)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Technician
                  </label>
                  <SearchableCombobox
                    value={assignedWorkerName}
                    onChange={(val) => {
                      const match = workers.find((w) => w.name.toLowerCase() === val.toLowerCase());
                      setAssignedWorkerId(match ? match.id : '');
                    }}
                    onSelectOption={(opt) => {
                      setAssignedWorkerId(opt.id);
                    }}
                    options={workerOptions}
                    placeholder="Select technician or click ▼..."
                    inputClassName="font-medium"
                  />
                </div>
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="e.g. Client requested visit after 5 PM..."
                  className="input-field font-sans"
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
                <button type="submit" className="btn-primary text-xs px-4">
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Service</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editable WhatsApp Service Dispatch Modal */}
      {waModalData && (
        <WhatsAppModal
          isOpen={waModalData.isOpen}
          onClose={() => setWaModalData(null)}
          recipientName={waModalData.name}
          recipientPhone={waModalData.phone}
          initialMessage={waModalData.message}
          defaultTarget={settings.whatsapp_target || 'desktop'}
          title="Send Service Update via WhatsApp"
        />
      )}
    </div>
  );
};
