import React, { useState, useRef } from 'react';
import { useDb } from '../../context/DbContext';
import { useLanguage } from '../../context/LanguageContext';
import { Customer } from '../../types';
import { formatCurrency, formatDate, formatDateInput } from '../../utils/formatters';
import { CustomerDetailModal } from '../customers/CustomerDetailModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Wallet,
  IndianRupee,
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Image as ImageIcon,
  X,
  Send,
  Edit3
} from 'lucide-react';

export const UdharKhataManager: React.FC = () => {
  const { customers, saveCustomer, settings } = useDb();
  const { t, language } = useLanguage();

  const printRef = useRef<HTMLDivElement>(null);

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'SETTLED'>('ACTIVE');

  // Modals
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [editingFollowUpCustomer, setEditingFollowUpCustomer] = useState<Customer | null>(null);
  const [showAddUdharModal, setShowAddUdharModal] = useState<boolean>(false);

  // Vasuli Form States
  const [vasuliAmount, setVasuliAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [vasuliNotes, setVasuliNotes] = useState<string>('');
  const [vasuliFollowUpDate, setVasuliFollowUpDate] = useState<string>('');

  // Follow-up Edit Form States
  const [followUpDateInput, setFollowUpDateInput] = useState<string>('');
  const [followUpNotesInput, setFollowUpNotesInput] = useState<string>('');

  // New Udhar Form States
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustMobile, setNewCustMobile] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');
  const [newUdharAmount, setNewUdharAmount] = useState<string>('');
  const [newUdharDueDate, setNewUdharDueDate] = useState<string>('');
  const [newUdharRemarks, setNewUdharRemarks] = useState<string>('');

  const todayStr = formatDateInput();

  // Aggregate Stats
  const activeUdharCustomers = customers.filter(c => c.dues_balance > 0);
  const totalOutstanding = activeUdharCustomers.reduce((acc, c) => acc + c.dues_balance, 0);

  const overdueCustomers = activeUdharCustomers.filter(c => {
    if (!c.follow_up_date) return false;
    return c.follow_up_date <= todayStr;
  });

  // Filtered List
  const filteredCustomers = customers.filter(c => {
    // Tab Filter
    if (filterType === 'ACTIVE' && c.dues_balance <= 0) return false;
    if (filterType === 'SETTLED' && c.dues_balance > 0) return false;
    if (filterType === 'OVERDUE') {
      if (c.dues_balance <= 0) return false;
      if (!c.follow_up_date || c.follow_up_date > todayStr) return false;
    }

    // Search Query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }).sort((a, b) => b.dues_balance - a.dues_balance);

  // Handle Record Vasuli Payment
  const handleSaveVasuli = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;

    const amt = parseFloat(vasuliAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const newBalance = Math.max(0, payingCustomer.dues_balance - amt);
    const updatedCust: Customer = {
      ...payingCustomer,
      dues_balance: newBalance,
      last_payment_date: todayStr,
      last_payment_amount: amt,
      follow_up_date: newBalance > 0 ? (vasuliFollowUpDate || payingCustomer.follow_up_date) : undefined,
      follow_up_notes: vasuliNotes ? vasuliNotes : payingCustomer.follow_up_notes,
      updated_at: new Date().toISOString()
    };

    saveCustomer(updatedCust);
    setPayingCustomer(null);
    setVasuliAmount('');
    setVasuliNotes('');
    setVasuliFollowUpDate('');
  };

  // Handle Update Follow-up
  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFollowUpCustomer) return;

    const updatedCust: Customer = {
      ...editingFollowUpCustomer,
      follow_up_date: followUpDateInput || undefined,
      follow_up_notes: followUpNotesInput || undefined,
      updated_at: new Date().toISOString()
    };

    saveCustomer(updatedCust);
    setEditingFollowUpCustomer(null);
  };

  // Handle Create / Add Udhar Record
  const handleCreateUdhar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustMobile.trim()) {
      alert('Customer name and mobile number are required.');
      return;
    }

    const amt = parseFloat(newUdharAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid Udhar amount.');
      return;
    }

    // Check if customer exists by mobile
    const existing = customers.find(c => c.mobile.trim() === newCustMobile.trim());
    if (existing) {
      const updated: Customer = {
        ...existing,
        name: newCustName.trim(),
        address: newCustAddress.trim() || existing.address,
        dues_balance: existing.dues_balance + amt,
        follow_up_date: newUdharDueDate || existing.follow_up_date,
        follow_up_notes: newUdharRemarks || existing.follow_up_notes,
        updated_at: new Date().toISOString()
      };
      saveCustomer(updated);
    } else {
      const newCust: Customer = {
        id: 'cust_' + Date.now(),
        name: newCustName.trim(),
        mobile: newCustMobile.trim(),
        address: newCustAddress.trim(),
        dues_balance: amt,
        follow_up_date: newUdharDueDate || undefined,
        follow_up_notes: newUdharRemarks || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      saveCustomer(newCust);
    }

    setShowAddUdharModal(false);
    setNewCustName('');
    setNewCustMobile('');
    setNewCustAddress('');
    setNewUdharAmount('');
    setNewUdharDueDate('');
    setNewUdharRemarks('');
  };

  // WhatsApp Reminder Generator
  const sendWhatsAppReminder = (cust: Customer) => {
    const cleanMobile = cust.mobile.replace(/\D/g, '');
    const mobileWithCode = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

    let message = '';
    if (language === 'mr') {
      message = `नमस्कार ${cust.name} जी,\n\n*${settings.shop_name}, सोलापूर* कडून स्मरणपत्र:\nआपल्या खात्यावरील एकूण बाकी रक्कम *₹${cust.dues_balance.toFixed(2)}* आहे.\n\nकृपया सदर बाकी रक्कम लवकरात लवकर जमा करावी ही नम्र विनंती.\nसंपर्क: ${settings.mobiles}\n\nधन्यवाद!`;
    } else if (language === 'hi') {
      message = `नमस्ते ${cust.name} जी,\n\n*${settings.shop_name}, सोलापुर* की ओर से रिमाइंडर:\nआपके खाते पर कुल बकाया राशि *₹${cust.dues_balance.toFixed(2)}* है।\n\nकृपया यह बकाया राशि शीघ्र जमा करने का कष्ट करें।\nसंपर्क: ${settings.mobiles}\n\nधन्यवाद!`;
    } else {
      message = `Dear ${cust.name},\n\nThis is a friendly payment reminder from *${settings.shop_name}, Solapur*.\nYour outstanding dues balance is *₹${cust.dues_balance.toFixed(2)}*.\n\nPlease clear the balance at your earliest convenience.\nContact: ${settings.mobiles}\n\nThank you!`;
    }

    const url = `https://wa.me/${mobileWithCode}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`StarLine_Udhar_Khata_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to export PDF');
    }
  };

  // Export Image
  const handleExportImage = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `StarLine_Udhar_Khata_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('udhar_title')}</h2>
            <p className="text-xs text-slate-500">Track pending customer dues, record vasuli, and send WhatsApp reminders</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setShowAddUdharModal(true)}
            className="btn-primary text-xs px-3.5 py-2 flex-1 sm:flex-none justify-center bg-red-600 hover:bg-red-700 text-white border-red-700"
          >
            <Plus className="w-4 h-4" />
            <span>{t('udhar_add_credit')}</span>
          </button>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              onClick={handleExportImage}
              className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              title="Export as Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportPdf}
              className="p-2 rounded bg-[#0F2942] hover:bg-[#1e3a5f] text-white"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-lg border border-red-200 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-red-50/40">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                {t('udhar_total_outstanding')}
              </span>
              <div className="text-2xl font-black text-red-700 mt-1 font-mono">
                {formatCurrency(totalOutstanding)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-red-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{activeUdharCustomers.length} active credit accounts</span>
          </div>
        </div>

        {/* Total Customers with Dues */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t('udhar_customers_count')}
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {activeUdharCustomers.length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Out of {customers.length} total customers
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t('udhar_pending_followups')}
              </span>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {overdueCustomers.length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-amber-700 font-semibold">
            Due today or overdue for call/visit
          </div>
        </div>

        {/* Settled Accounts */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Settled Accounts (₹0)
              </span>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {customers.filter(c => c.dues_balance === 0).length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-700 font-semibold">
            Fully paid & up to date
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('udhar_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pr-9 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-100 p-1 rounded-md text-xs font-semibold text-slate-700 overflow-x-auto">
            <button
              onClick={() => setFilterType('ACTIVE')}
              className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                filterType === 'ACTIVE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {t('udhar_filter_active')} ({activeUdharCustomers.length})
            </button>
            <button
              onClick={() => setFilterType('OVERDUE')}
              className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                filterType === 'OVERDUE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {t('udhar_filter_overdue')} ({overdueCustomers.length})
            </button>
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                filterType === 'ALL'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {t('udhar_filter_all')} ({customers.length})
            </button>
            <button
              onClick={() => setFilterType('SETTLED')}
              className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                filterType === 'SETTLED'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {t('udhar_filter_settled')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Udhar Register Table */}
      <div ref={printRef} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-red-600" />
            <span>Customer Udhar Ledger Register</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredCustomers.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header">
              <tr>
                <th className="py-3 px-3">Customer Details</th>
                <th className="py-3 px-3">Mobile & Address</th>
                <th className="py-3 px-3 text-right">Outstanding Dues (₹)</th>
                <th className="py-3 px-3">Follow-up / Promise Date</th>
                <th className="py-3 px-3">Last Payment</th>
                <th className="py-3 px-3 text-right">Actions & Reminders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                    No customer credit records match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isOverdue = cust.follow_up_date && cust.follow_up_date <= todayStr && cust.dues_balance > 0;
                  const isDueToday = cust.follow_up_date === todayStr && cust.dues_balance > 0;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                        {cust.gstin && (
                          <div className="text-[10.5px] text-blue-900 font-mono font-semibold">
                            GSTIN: {cust.gstin}
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3 text-slate-600">
                        <a
                          href={`tel:${cust.mobile}`}
                          className="font-mono font-semibold text-slate-800 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.mobile}</span>
                        </a>
                        {cust.address && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                            {cust.address}
                          </div>
                        )}
                      </td>

                      {/* Dues Balance */}
                      <td className="py-3 px-3 text-right font-mono">
                        {cust.dues_balance > 0 ? (
                          <span className="font-black text-red-600 text-sm bg-red-50 px-2.5 py-1 rounded border border-red-200 inline-block">
                            ₹{cust.dues_balance.toFixed(2)}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            ₹0.00 (Settled)
                          </span>
                        )}
                      </td>

                      {/* Follow-up / Promise */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {cust.follow_up_date ? (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono ${
                                isDueToday
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isOverdue
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {formatDate(cust.follow_up_date)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No date set</span>
                          )}

                          <button
                            onClick={() => {
                              setEditingFollowUpCustomer(cust);
                              setFollowUpDateInput(cust.follow_up_date || '');
                              setFollowUpNotesInput(cust.follow_up_notes || '');
                            }}
                            className="text-slate-400 hover:text-blue-900 p-1"
                            title="Edit follow-up date & note"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {cust.follow_up_notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 italic truncate max-w-[220px]">
                            "{cust.follow_up_notes}"
                          </div>
                        )}
                      </td>

                      {/* Last Payment */}
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {cust.last_payment_date ? (
                          <div>
                            <div className="font-semibold text-emerald-800">
                              +₹{cust.last_payment_amount || 0}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {formatDate(cust.last_payment_date)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Reminder */}
                          {cust.dues_balance > 0 && (
                            <button
                              onClick={() => sendWhatsAppReminder(cust)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                              title="Send WhatsApp Payment Reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">WhatsApp</span>
                            </button>
                          )}

                          {/* Record Vasuli */}
                          {cust.dues_balance > 0 && (
                            <button
                              onClick={() => {
                                setPayingCustomer(cust);
                                setVasuliAmount(String(cust.dues_balance));
                              }}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                              title="Record Vasuli / Payment"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span>Vasuli</span>
                            </button>
                          )}

                          {/* Ledger */}
                          <button
                            onClick={() => setSelectedCustomerForLedger(cust)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                            title="View Full Customer Bill Ledger"
                          >
                            <FileText className="w-4 h-4" />
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

      {/* Record Vasuli Modal */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-red-600" />
                <span>{t('udhar_record_vasuli')}</span>
              </h3>
              <button onClick={() => setPayingCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs space-y-1">
              <div className="font-bold text-slate-900 text-sm">{payingCustomer.name}</div>
              <div className="text-slate-600 font-mono">Mobile: {payingCustomer.mobile}</div>
              <div className="flex justify-between items-center pt-1 border-t border-red-200">
                <span className="text-slate-700 font-medium">Current Dues Balance:</span>
                <span className="text-base font-black text-red-700 font-mono">
                  {formatCurrency(payingCustomer.dues_balance)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveVasuli} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount to Collect (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payingCustomer.dues_balance}
                  step="any"
                  value={vasuliAmount}
                  onChange={(e) => setVasuliAmount(e.target.value)}
                  className="input-field text-base font-bold text-emerald-800 font-mono"
                  placeholder="Enter received amount"
                />

                {/* Quick shortcut chips */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setVasuliAmount(String(payingCustomer.dues_balance))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                  >
                    Full: ₹{payingCustomer.dues_balance}
                  </button>
                  {[500, 1000, 2000, 5000].map(val => (
                    val <= payingCustomer.dues_balance ? (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setVasuliAmount(String(val))}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                      >
                        ₹{val}
                      </button>
                    ) : null
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="input-field cursor-pointer font-medium"
                >
                  <option value="Cash">Cash (रोख)</option>
                  <option value="PhonePe / GPay / UPI">PhonePe / GPay / UPI (ऑनलाइन)</option>
                  <option value="Bank Transfer / Cheque">Bank Transfer / NEFT / Cheque</option>
                </select>
              </div>

              {/* If partial payment, set next follow up */}
              {parseFloat(vasuliAmount) < payingCustomer.dues_balance && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Follow-up / Promise Date (for remaining balance)
                  </label>
                  <input
                    type="date"
                    value={vasuliFollowUpDate}
                    onChange={(e) => setVasuliFollowUpDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vasuli Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash at counter / GPay transaction"
                  value={vasuliNotes}
                  onChange={(e) => setVasuliNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="btn-secondary text-xs"
                >
                  {t('action_cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Vasuli Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Follow-up Modal */}
      {editingFollowUpCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-900" />
                <span>Set Follow-up Date & Remarks</span>
              </h3>
              <button onClick={() => setEditingFollowUpCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Customer: <strong className="text-slate-900">{editingFollowUpCustomer.name}</strong> (Dues: ₹{editingFollowUpCustomer.dues_balance})
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('udhar_follow_up_date')}
                </label>
                <input
                  type="date"
                  value={followUpDateInput}
                  onChange={(e) => setFollowUpDateInput(e.target.value)}
                  className="input-field font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('udhar_follow_up_note')}
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Promised to pay on 5th after salary / Requested 3 days time"
                  value={followUpNotesInput}
                  onChange={(e) => setFollowUpNotesInput(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingFollowUpCustomer(null)}
                  className="btn-secondary text-xs"
                >
                  {t('action_cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4"
                >
                  {t('action_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Udhar Record Modal */}
      {showAddUdharModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                <span>{t('udhar_add_credit')}</span>
              </h3>
              <button onClick={() => setShowAddUdharModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUdhar} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Patil"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="input-field font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">10-Digit Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={newCustMobile}
                    onChange={(e) => setNewCustMobile(e.target.value)}
                    className="input-field font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Udhar / Dues Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="Amount in ₹"
                    value={newUdharAmount}
                    onChange={(e) => setNewUdharAmount(e.target.value)}
                    className="input-field font-bold text-red-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Address / Area</label>
                <input
                  type="text"
                  placeholder="Area / Street name, Solapur"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Promised Due Date</label>
                  <input
                    type="date"
                    value={newUdharDueDate}
                    onChange={(e) => setNewUdharDueDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Appliance / Reason Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Fridge compressor repair balance"
                    value={newUdharRemarks}
                    onChange={(e) => setNewUdharRemarks(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUdharModal(false)}
                  className="btn-secondary text-xs"
                >
                  {t('action_cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Send className="w-4 h-4" />
                  <span>Save Udhar Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail / Ledger Modal */}
      {selectedCustomerForLedger && (
        <CustomerDetailModal
          customer={selectedCustomerForLedger}
          onClose={() => setSelectedCustomerForLedger(null)}
        />
      )}
    </div>
  );
};
