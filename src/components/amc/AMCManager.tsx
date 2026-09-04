import React, { useState, useMemo } from 'react';
import { useDb } from '../../context/DbContext';
import { AMCContract, AMCDuration, AMCStatus } from '../../types';
import { formatDate, formatDateInput, formatCurrency } from '../../utils/formatters';
import { SearchableCombobox, ComboboxOption } from '../common/SearchableCombobox';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  MessageCircle,
  Phone,
  Calendar,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export const AMCManager: React.FC = () => {
  const {
    amcContracts,
    customers,
    settings,
    saveAMCContract,
    deleteAMCContract
  } = useDb();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'ALL' | AMCStatus>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingContract, setEditingContract] = useState<AMCContract | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [applianceName, setApplianceName] = useState<string>('Split Air Conditioner');
  const [brandModel, setBrandModel] = useState<string>('');
  const [duration, setDuration] = useState<AMCDuration>('1_YEAR');
  const [startDate, setStartDate] = useState<string>(formatDateInput());
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return formatDateInput(d);
  });
  const [chargeAmount, setChargeAmount] = useState<string>('2499');
  const [status, setStatus] = useState<AMCStatus>('ACTIVE');
  const [notes, setNotes] = useState<string>('');

  // Customer options for Combobox
  const customerOptions = useMemo<ComboboxOption[]>(() => {
    return customers.map((c) => ({
      id: c.id,
      label: c.name,
      subLabel: c.mobile ? `Mobile: ${c.mobile}${c.address ? ` | ${c.address}` : ''}` : c.address,
      data: c
    }));
  }, [customers]);

  const calculateDaysRemaining = (endDateStr: string): number => {
    const end = new Date(endDateStr + 'T23:59:59');
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEffectiveStatus = (contract: AMCContract): AMCStatus => {
    if (contract.status === 'RENEWED') return 'RENEWED';
    const days = calculateDaysRemaining(contract.end_date);
    if (days < 0) return 'EXPIRED';
    if (days <= 30) return 'EXPIRING_SOON';
    return 'ACTIVE';
  };

  // Helper to recompute End Date when Start Date or Duration changes
  const updateEndDateByDuration = (start: string, dur: AMCDuration) => {
    if (dur === 'CUSTOM') return;
    const d = new Date(start || new Date());
    if (dur === '1_YEAR') {
      d.setFullYear(d.getFullYear() + 1);
    } else if (dur === '6_MONTHS') {
      d.setMonth(d.getMonth() + 6);
    } else if (dur === '3_MONTHS') {
      d.setMonth(d.getMonth() + 3);
    }
    setEndDate(formatDateInput(d));
  };

  const handleDurationChange = (dur: AMCDuration) => {
    setDuration(dur);
    updateEndDateByDuration(startDate, dur);
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    updateEndDateByDuration(newStart, duration);
  };

  const handleOpenNewModal = () => {
    setEditingContract(null);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setApplianceName('Split Air Conditioner');
    setBrandModel('');
    setDuration('1_YEAR');
    const today = formatDateInput();
    setStartDate(today);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setEndDate(formatDateInput(nextYear));
    setChargeAmount('2499');
    setStatus('ACTIVE');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (c: AMCContract) => {
    setEditingContract(c);
    setCustomerName(c.customer_name);
    setCustomerMobile(c.customer_mobile || '');
    setCustomerAddress(c.customer_address || '');
    setApplianceName(c.appliance_name);
    setBrandModel(c.brand_model || '');
    setDuration(c.duration);
    setStartDate(c.start_date);
    setEndDate(c.end_date);
    setChargeAmount(c.charge_amount.toString());
    setStatus(c.status);
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleOpenRenewModal = (c: AMCContract) => {
    // Mark previous as RENEWED
    saveAMCContract({
      ...c,
      status: 'RENEWED',
      updated_at: new Date().toISOString()
    });

    // Create a new contract starting from the expiry of the previous or today
    const newStart = c.end_date >= formatDateInput() ? c.end_date : formatDateInput();
    const d = new Date(newStart);
    d.setFullYear(d.getFullYear() + 1);
    const newEnd = formatDateInput(d);

    setEditingContract(null);
    setCustomerName(c.customer_name);
    setCustomerMobile(c.customer_mobile || '');
    setCustomerAddress(c.customer_address || '');
    setApplianceName(c.appliance_name);
    setBrandModel(c.brand_model || '');
    setDuration(c.duration || '1_YEAR');
    setStartDate(newStart);
    setEndDate(newEnd);
    setChargeAmount(c.charge_amount.toString());
    setStatus('ACTIVE');
    setNotes(`Renewed from previous AMC (${c.contract_num})`);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter or select a customer name.');
      return;
    }
    if (!applianceName.trim()) {
      alert('Please enter an appliance name (e.g. Split AC, Refrigerator).');
      return;
    }

    const payload: AMCContract = {
      id: editingContract ? editingContract.id : 'amc_' + Date.now(),
      contract_num: editingContract ? editingContract.contract_num : '',
      customer_name: customerName.trim(),
      customer_mobile: customerMobile.trim() || '',
      customer_address: customerAddress.trim() || '',
      appliance_name: applianceName.trim(),
      brand_model: brandModel.trim() || undefined,
      duration: duration,
      start_date: startDate,
      end_date: endDate,
      charge_amount: parseFloat(chargeAmount) || 0,
      paid_amount: parseFloat(chargeAmount) || 0,
      status: status,
      notes: notes.trim() || undefined,
      created_at: editingContract ? editingContract.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveAMCContract(payload);
    setShowModal(false);
  };

  const handleDelete = (id: string, contractNum: string) => {
    if (window.confirm(`Are you sure you want to delete AMC Contract ${contractNum}?`)) {
      deleteAMCContract(id);
    }
  };

  const handleWhatsAppReminder = (c: AMCContract) => {
    const phone = (c.customer_mobile || '').replace(/\D/g, '');
    if (!phone) {
      alert('No phone number provided for this customer.');
      return;
    }
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const days = calculateDaysRemaining(c.end_date);
    const expiryText = days < 0 
      ? `expired on ${c.end_date}` 
      : `is expiring on ${c.end_date} (${days} days left)`;
    
    const message = `Hello ${c.customer_name},\n\nGreetings from *${settings?.shop_name || 'Star Line Services'}*!\n\nThis is a friendly reminder regarding your Annual Maintenance Contract (AMC):\n\n📄 *Contract No:* ${c.contract_num}\n❄️ *Appliance:* ${c.appliance_name} ${c.brand_model ? `(${c.brand_model})` : ''}\n📅 *Expiry Date:* ${expiryText}\n💰 *Annual AMC Fee:* ₹${c.charge_amount}\n\nRenewing your AMC ensures regular scheduled checkups, free priority repair visits, and peace of mind. Please reply here or call us to renew your plan today!\n\nThank you!`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Metrics computation
  const metrics = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let renewed = 0;

    amcContracts.forEach((c) => {
      const eff = getEffectiveStatus(c);
      if (eff === 'ACTIVE') active++;
      else if (eff === 'EXPIRING_SOON') expiringSoon++;
      else if (eff === 'EXPIRED') expired++;
      else if (eff === 'RENEWED') renewed++;
    });

    return {
      total: amcContracts.length,
      active,
      expiringSoon,
      expired,
      renewed
    };
  }, [amcContracts]);

  // Filtered list
  const filteredContracts = useMemo(() => {
    return amcContracts.filter((c) => {
      const effStatus = getEffectiveStatus(c);
      if (filterTab !== 'ALL' && effStatus !== filterTab) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.customer_name.toLowerCase().includes(q) ||
        (c.customer_mobile && c.customer_mobile.includes(q)) ||
        (c.contract_num && c.contract_num.toLowerCase().includes(q)) ||
        c.appliance_name.toLowerCase().includes(q) ||
        (c.brand_model && c.brand_model.toLowerCase().includes(q)) ||
        (c.customer_address && c.customer_address.toLowerCase().includes(q))
      );
    });
  }, [amcContracts, filterTab, searchQuery]);

  const durationLabels: Record<AMCDuration, string> = {
    '1_YEAR': '1 Year',
    '6_MONTHS': '6 Months',
    '3_MONTHS': '3 Months',
    'CUSTOM': 'Custom'
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              Annual Maintenance Contracts (AMC)
              {metrics.expiringSoon > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  {metrics.expiringSoon} Expiring Soon
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500">
              Track customer appliances, annual contracts, expiration countdowns, and send 1-click WhatsApp reminders.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-medium shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New AMC Contract</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Contracts</span>
            <FileCheck className="w-5 h-5 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{metrics.total}</div>
          <div className="text-xs text-slate-400 mt-1">All recorded AMC agreements</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Active</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{metrics.active}</div>
          <div className="text-xs text-emerald-600 mt-1">Healthy ongoing coverage</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Expiring Soon (30d)</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{metrics.expiringSoon}</div>
          <div className="text-xs text-amber-600 mt-1">Needs renewal outreach</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 uppercase tracking-wider">Expired</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700">{metrics.expired}</div>
          <div className="text-xs text-rose-600 mt-1">Ready for re-activation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'RENEWED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterTab === tab
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL'
                ? 'All Contracts'
                : tab === 'ACTIVE'
                ? 'Active'
                : tab === 'EXPIRING_SOON'
                ? 'Expiring Soon'
                : tab === 'EXPIRED'
                ? 'Expired'
                : 'Renewed'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, appliance, contract #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Contracts Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No AMC Contracts Found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || filterTab !== 'ALL'
                ? 'No contracts matched your filter or search query.'
                : 'Click "+ New AMC Contract" above to record customer appliance maintenance agreements.'}
            </p>
            {(!searchQuery && filterTab === 'ALL') && (
              <button
                onClick={handleOpenNewModal}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create First Contract
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Contract #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Appliance & Model</th>
                  <th className="py-3.5 px-4">Plan Duration</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Days Left / Status</th>
                  <th className="py-3.5 px-4 text-right">Fee (₹)</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredContracts.map((contract) => {
                  const daysLeft = calculateDaysRemaining(contract.end_date);
                  const effStatus = getEffectiveStatus(contract);

                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Contract # */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-slate-800 text-xs">
                          {contract.contract_num}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(contract.created_at)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{contract.customer_name}</div>
                        {contract.customer_mobile && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{contract.customer_mobile}</span>
                          </div>
                        )}
                        {contract.customer_address && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {contract.customer_address}
                          </div>
                        )}
                      </td>

                      {/* Appliance */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{contract.appliance_name}</div>
                        {contract.brand_model && (
                          <div className="text-xs text-slate-500 font-medium">
                            {contract.brand_model}
                          </div>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          {durationLabels[contract.duration] || contract.duration}
                        </span>
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{contract.start_date} to {contract.end_date}</span>
                        </div>
                      </td>

                      {/* Days Left & Status */}
                      <td className="py-3.5 px-4">
                        {effStatus === 'RENEWED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            <RotateCcw className="w-3 h-3" />
                            Renewed
                          </span>
                        ) : effStatus === 'EXPIRED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            Expired ({Math.abs(daysLeft)}d ago)
                          </span>
                        ) : effStatus === 'EXPIRING_SOON' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {daysLeft} days left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {daysLeft} days left
                          </span>
                        )}
                      </td>

                      {/* Fee */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(contract.charge_amount)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Reminder Button */}
                          <button
                            onClick={() => handleWhatsAppReminder(contract)}
                            title="Send WhatsApp Expiry / Renewal Reminder"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* Renew Button */}
                          <button
                            onClick={() => handleOpenRenewModal(contract)}
                            title="Renew Contract"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(contract)}
                            title="Edit Contract"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(contract.id, contract.contract_num)}
                            title="Delete Contract"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New / Edit AMC Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl my-6 border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingContract ? `Edit AMC Contract: ${editingContract.contract_num}` : 'New AMC Maintenance Contract'}
                  </h3>
                  <p className="text-xs text-slate-500">Record annual servicing agreement for appliances</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              {/* Customer Selector / Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <SearchableCombobox
                  options={customerOptions}
                  value={customerName}
                  onChange={(val) => setCustomerName(val)}
                  onSelectOption={(opt) => {
                    if (opt?.data) {
                      const c = opt.data as any;
                      setCustomerName(c.name || '');
                      if (c.mobile) setCustomerMobile(c.mobile);
                      if (c.address) setCustomerAddress(c.address);
                    }
                  }}
                  placeholder="Select or enter customer name"
                />
              </div>

              {/* Phone and Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Phone (for WhatsApp Reminders)
                  </label>
                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Address
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Premises / Flat / Area"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Appliance Name & Brand/Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appliance Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={applianceName}
                    onChange={(e) => setApplianceName(e.target.value)}
                    placeholder="e.g. Split AC, Refrigerator, RO"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand & Model
                  </label>
                  <input
                    type="text"
                    value={brandModel}
                    onChange={(e) => setBrandModel(e.target.value)}
                    placeholder="e.g. Daikin Inverter 1.5 Ton"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Plan Duration Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Plan Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['1_YEAR', '6_MONTHS', '3_MONTHS', 'CUSTOM'] as AMCDuration[]).map((dur) => (
                    <button
                      type="button"
                      key={dur}
                      onClick={() => handleDurationChange(dur)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                        duration === dur
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {durationLabels[dur]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry / End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* AMC Charge & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    AMC Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AMCStatus)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRING_SOON">Expiring Soon</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="RENEWED">Renewed</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terms / Notes / Free Visits Included
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Includes 3 free preventive dry services + unlimited emergency visits."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
                >
                  {editingContract ? 'Update Contract' : 'Save AMC Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
