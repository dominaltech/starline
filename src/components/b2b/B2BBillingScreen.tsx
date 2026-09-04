import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDb } from '../../context/DbContext';
import { B2BBill, B2BBillItem, B2BPaymentMethod, Mechanic, Product, PaymentSplit } from '../../types';
import { formatDate, formatDateInput, formatCurrency } from '../../utils/formatters';
import { SearchableCombobox, ComboboxOption } from '../common/SearchableCombobox';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Save,
  Mic,
  Camera,
  Upload,
  CheckCircle,
  X,
  History,
  RotateCcw,
  Check,
  Eye,
  Printer,
  MessageCircle,
  AlertTriangle,
  Phone,
  Building,
  CreditCard,
  Banknote,
  Globe,
  Layers,
  AlertCircle
} from 'lucide-react';

export const B2BBillingScreen: React.FC = () => {
  const {
    products,
    mechanics,
    b2bBills,
    saveB2BBill,
    saveProduct,
    deleteB2BBill
  } = useDb();

  // Active view: 'new' bill or 'history'
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Form Header State
  const [billDate, setBillDate] = useState<string>(formatDateInput());
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');
  const [mechanicName, setMechanicName] = useState<string>('');
  const [mechanicPhone, setMechanicPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<B2BPaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [splitPayment, setSplitPayment] = useState<PaymentSplit>({
    cash: 0,
    online1: 0,
    online2: 0,
    online3: 0,
    udhar: 0
  });
  const [notes, setNotes] = useState<string>('');

  // Selected mechanic record for showing dues
  const selectedMechanic = useMemo(() => {
    if (selectedMechanicId) {
      return mechanics.find((m) => m.id === selectedMechanicId);
    }
    if (mechanicName.trim()) {
      return mechanics.find((m) => m.name.toLowerCase() === mechanicName.trim().toLowerCase());
    }
    return undefined;
  }, [selectedMechanicId, mechanicName, mechanics]);

  // Save Success Notification Toast
  const [successToast, setSuccessToast] = useState<{
    invoiceNum: string;
    amount: number;
    paid: number;
    due: number;
  } | null>(null);

  // Line Items State
  const [items, setItems] = useState<B2BBillItem[]>([
    {
      id: 'b2bi_' + Date.now() + '_0',
      product_name: '',
      qty: 1,
      price: 0,
      total: 0
    }
  ]);

  // Voice Search States
  const [isListeningMech, setIsListeningMech] = useState<boolean>(false);
  const [voiceItemIndex, setVoiceItemIndex] = useState<number>(-1);

  // History search filter
  const [historySearch, setHistorySearch] = useState<string>('');

  // Selected Bill for View Slip Modal
  const [viewingBill, setViewingBill] = useState<B2BBill | null>(null);

  // Bulk Image Upload Modal
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkDrafts, setBulkDrafts] = useState<
    Array<{ id: string; image_data: string; name: string; price: string; qty: string }>
  >([]);

  // Print slip ref
  const slipPrintRef = useRef<HTMLDivElement>(null);

  // Calculate Grand Total
  const grandTotal = items.reduce((sum, it) => sum + (it.total || 0), 0);

  // Parse paid amount and calculate due amount
  const parsedPaid = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, Math.round((grandTotal - parsedPaid) * 100) / 100);

  // Update paid amount when grand total changes (only if not in Udhar mode with 0)
  useEffect(() => {
    if (paymentMethod === 'Udhar') {
      if (!paidAmount) setPaidAmount('0');
    } else {
      if (!paidAmount || parseFloat(paidAmount) === grandTotal || parseFloat(paidAmount) === 0) {
        setPaidAmount(String(grandTotal));
      }
    }
  }, [grandTotal]);

  // When payment method changes:
  const handlePaymentMethodChange = (mode: B2BPaymentMethod) => {
    setPaymentMethod(mode);
    if (mode === 'Udhar') {
      setPaidAmount('0');
    } else if (mode === 'Split') {
      setSplitPayment({
        cash: grandTotal,
        online1: 0,
        online2: 0,
        online3: 0,
        udhar: 0
      });
      setPaidAmount(String(grandTotal));
    } else {
      setPaidAmount(String(grandTotal));
    }
  };

  // Options for Mechanic Combobox (from registered mechanics in Settings)
  const mechanicOptions = useMemo<ComboboxOption[]>(() => {
    return mechanics.map((m) => ({
      id: m.id,
      label: m.name,
      subLabel: `${m.workshop_name ? `${m.workshop_name} • ` : ''}${m.phone || 'No phone'}`,
      badge: m.dues_balance > 0 ? `Dues: ₹${m.dues_balance}` : undefined,
      badgeColor: m.dues_balance > 0 ? 'bg-amber-100 text-amber-900' : undefined,
      data: m
    }));
  }, [mechanics]);

  const selectMechanic = (m: Mechanic) => {
    setSelectedMechanicId(m.id);
    setMechanicName(m.name);
    setMechanicPhone(m.phone || '');
  };

  // Options for Products Combobox
  const productOptions = useMemo<ComboboxOption[]>(() => {
    return products.map((p) => ({
      id: p.id,
      label: p.name,
      subLabel: `${p.type || p.sku ? `[${p.type || p.sku}] ` : ''}Stock: ${p.stock_qty} ${p.unit}`,
      badge: `₹${p.selling_price}`,
      badgeColor:
        p.stock_qty <= (p.min_stock_alert || 5)
          ? 'bg-rose-100 text-rose-900'
          : 'bg-emerald-100 text-emerald-900',
      data: p
    }));
  }, [products]);

  // Line item manipulation
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 'b2bi_' + Date.now() + '_' + prev.length,
        product_name: '',
        qty: 1,
        price: 0,
        total: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      setItems([
        {
          id: 'b2bi_' + Date.now() + '_0',
          product_name: '',
          qty: 1,
          price: 0,
          total: 0
        }
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemField = (
    index: number,
    field: keyof B2BBillItem,
    val: string | number | undefined
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: val };

      if (field === 'qty' || field === 'price') {
        const q = typeof target.qty === 'number' ? target.qty : parseFloat(target.qty as any) || 0;
        const p = typeof target.price === 'number' ? target.price : parseFloat(target.price as any) || 0;
        target.total = Math.round(q * p * 100) / 100;
      }

      updated[index] = target;
      return updated;
    });
  };

  const selectProduct = (index: number, prod: Product) => {
    setItems((prev) => {
      const updated = [...prev];
      const currentQty = updated[index]?.qty || 1;
      const price = prod.selling_price || 0;
      updated[index] = {
        ...updated[index],
        product_id: prod.id,
        product_name: prod.name,
        price: price,
        qty: currentQty,
        total: Math.round(currentQty * price * 100) / 100,
        image_data: prod.image_data || updated[index]?.image_data
      };
      return updated;
    });
  };

  // Image Upload from PC
  const handleImageFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 850 * 1024) {
      alert('Photo is larger than 800KB. Please select a smaller photo for optimal offline storage.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateItemField(index, 'image_data', base64);
    };
    reader.readAsDataURL(file);
  };

  // Voice recognition for Product Name per row
  const startVoiceProduct = (index: number) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported by your browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setVoiceItemIndex(index);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        updateItemField(index, 'product_name', transcript);
        const match = products.find((p) => p.name.toLowerCase() === transcript.toLowerCase());
        if (match) selectProduct(index, match);
        setVoiceItemIndex(-1);
      };

      recognition.onerror = () => setVoiceItemIndex(-1);
      recognition.onend = () => setVoiceItemIndex(-1);

      recognition.start();
    } catch {
      setVoiceItemIndex(-1);
    }
  };

  // Voice recognition for Mechanic Name
  const startVoiceMechanic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported by your browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningMech(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMechanicName(transcript);
        const match = mechanics.find(
          (m) => m.name.toLowerCase() === transcript.toLowerCase()
        );
        if (match) selectMechanic(match);
        setIsListeningMech(false);
      };

      recognition.onerror = () => setIsListeningMech(false);
      recognition.onend = () => setIsListeningMech(false);

      recognition.start();
    } catch {
      setIsListeningMech(false);
    }
  };

  // Bulk Image Upload Handler
  const handleBulkFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const drafts: Array<{ id: string; image_data: string; name: string; price: string; qty: string }> = [];
    let count = 0;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        drafts.push({
          id: 'draft_' + Date.now() + '_' + index,
          image_data: ev.target?.result as string,
          name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          price: '0',
          qty: '1'
        });
        count++;
        if (count === files.length) {
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
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: draft.name.trim(),
        unit: 'NOS',
        selling_price: parseFloat(draft.price) || 0,
        stock_qty: parseInt(draft.qty, 10) || 0,
        image_data: draft.image_data,
        min_stock_alert: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    setShowBulkModal(false);
    setBulkDrafts([]);
    alert(`Added ${bulkDrafts.length} independent products into catalog!`);
  };

  // Reset Form Cleanly
  const handleResetForm = () => {
    setSelectedMechanicId('');
    setMechanicName('');
    setMechanicPhone('');
    setPaidAmount('');
    setSplitPayment({ cash: 0, online1: 0, online2: 0, online3: 0, udhar: 0 });
    setNotes('');
    setPaymentMethod('Cash');
    setItems([
      {
        id: 'b2bi_' + Date.now() + '_0',
        product_name: '',
        qty: 1,
        price: 0,
        total: 0
      }
    ]);
  };

  // Save B2B Bill
  const handleSaveBill = () => {
    const validItems = items.filter((i) => i.product_name.trim().length > 0);
    if (validItems.length === 0) {
      alert('Please add at least one product name and price.');
      return;
    }

    const currentGrandTotal = validItems.reduce((sum, it) => sum + (it.total || 0), 0);

    let finalPaid = currentGrandTotal;
    let finalDue = 0;
    let splitObj: PaymentSplit | undefined = undefined;

    if (paymentMethod === 'Split') {
      const splitCash = splitPayment.cash || 0;
      const splitOnline1 = splitPayment.online1 || 0;
      const splitOnline2 = splitPayment.online2 || 0;
      const splitOnline3 = splitPayment.online3 || 0;
      const splitUdhar = splitPayment.udhar || 0;
      const splitSum = splitCash + splitOnline1 + splitOnline2 + splitOnline3 + splitUdhar;

      if (Math.abs(splitSum - currentGrandTotal) > 0.5) {
        alert(
          `Split payment total (₹${splitSum.toFixed(2)}) must equal total bill amount (₹${currentGrandTotal.toFixed(2)}).`
        );
        return;
      }
      finalPaid = splitCash + splitOnline1 + splitOnline2 + splitOnline3;
      finalDue = splitUdhar;
      splitObj = { ...splitPayment };
    } else {
      finalPaid =
        paymentMethod === 'Udhar' && (!paidAmount || paidAmount === '0')
          ? 0
          : parseFloat(paidAmount) !== undefined && !isNaN(parseFloat(paidAmount))
          ? parseFloat(paidAmount)
          : currentGrandTotal;
      finalDue = Math.max(0, Math.round((currentGrandTotal - finalPaid) * 100) / 100);
    }

    const invoiceNum = 'B2B-' + String(b2bBills.length + 1).padStart(3, '0');

    const newBill: B2BBill = {
      id: 'b2b_' + Date.now(),
      invoice_num: invoiceNum,
      bill_date: billDate,
      mechanic_id: selectedMechanicId || undefined,
      mechanic_name: mechanicName.trim() || 'Walk-in Mechanic',
      mechanic_phone: mechanicPhone.trim(),
      customer_name: mechanicName.trim() || 'Walk-in Mechanic',
      customer_mobile: mechanicPhone.trim(),
      items: validItems,
      total_amount: currentGrandTotal,
      payment_method: paymentMethod,
      split_payment: splitObj,
      paid_amount: finalPaid,
      due_amount: finalDue,
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };

    saveB2BBill(newBill);

    // Show instant success notification banner
    setSuccessToast({
      invoiceNum: newBill.invoice_num,
      amount: currentGrandTotal,
      paid: finalPaid,
      due: finalDue
    });
    setTimeout(() => setSuccessToast(null), 6000);

    // Reset Form for next bill
    handleResetForm();
  };

  // Delete B2B Bill
  const handleDeleteBill = (id: string, invNum: string) => {
    const confirm = window.confirm(`Are you sure you want to delete Daily B2B Bill #${invNum}? Product stock will be restored.`);
    if (confirm) {
      deleteB2BBill(id);
    }
  };

  // Print slip action
  const handlePrintSlip = () => {
    window.print();
  };

  // WhatsApp Slip action
  const handleWhatsAppSlip = (bill: B2BBill) => {
    const phone = (bill.mechanic_phone || bill.customer_mobile || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      alert('Mechanic mobile number is not available or incomplete.');
      return;
    }
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const itemsText = bill.items
      .map((it, i) => `${i + 1}. ${it.product_name} x ${it.qty} = ₹${it.total.toFixed(2)}`)
      .join('\n');

    const msg =
      `*STAR LINE SERVICES, SOLAPUR*\n` +
      `*Daily B2B Spare Parts Bill #${bill.invoice_num}*\n` +
      `Date: ${formatDate(bill.bill_date)}\n` +
      `Mechanic: *${bill.mechanic_name}*\n` +
      `------------------------------------\n` +
      `*ITEMS PURCHASED:*\n` +
      `${itemsText}\n` +
      `------------------------------------\n` +
      `*Total Amount: ₹${bill.total_amount.toFixed(2)}*\n` +
      `Payment Mode: ${bill.payment_method}\n` +
      `Amount Paid: ₹${(bill.paid_amount || 0).toFixed(2)}\n` +
      `*Remaining Udhar: ₹${(bill.due_amount || 0).toFixed(2)}*\n` +
      `------------------------------------\n` +
      `Shop No. 3, Anvar Estate, South Sadar Bazar, Solapur\n` +
      `Contact: 7775038897 / 7776011808\n` +
      `Thank you for your business!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Today's metrics
  const todayStr = formatDateInput();
  const todaysBills = b2bBills.filter((b) => b.bill_date === todayStr);
  const todaysTotal = todaysBills.reduce((sum, b) => sum + b.total_amount, 0);
  const cashTotal = todaysBills
    .filter((b) => b.payment_method === 'Cash')
    .reduce((sum, b) => sum + (b.paid_amount || 0), 0);
  const onlineTotal = todaysBills
    .filter((b) => ['Online 1', 'Online 2', 'Online 3', 'PhonePe', 'GPay', 'Bank Transfer'].includes(b.payment_method))
    .reduce((sum, b) => sum + (b.paid_amount || 0), 0);
  const udharTotal = todaysBills.reduce((sum, b) => sum + (b.due_amount !== undefined ? b.due_amount : (b.total_amount - (b.paid_amount || 0))), 0);

  // Filtered History
  const filteredHistory = b2bBills.filter((b) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase().trim();
    return (
      b.invoice_num.toLowerCase().includes(q) ||
      b.mechanic_name.toLowerCase().includes(q) ||
      (b.mechanic_phone && b.mechanic_phone.includes(q)) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
      (b.customer_mobile && b.customer_mobile.includes(q)) ||
      b.items.some((it) => it.product_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col space-y-2">
      {/* Header & Live Daily Metric Bar */}
      <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-none">
              B2B Mechanic Billing
            </h2>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded hidden sm:inline">
              Daily Trade
            </span>
          </div>

          {/* Success Notification Pill */}
          {successToast && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded font-semibold animate-pulse">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Bill #{successToast.invoiceNum} ({formatCurrency(successToast.amount)}) saved!
                {successToast.due > 0 ? ` [Udhar: ${formatCurrency(successToast.due)}]` : ' [Fully Paid]'}
              </span>
              <button
                type="button"
                onClick={() => setSuccessToast(null)}
                className="ml-1 text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Live Daily Metrics & Action Buttons */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-medium text-[11px]">
            Today: <strong className="text-slate-900 font-mono">{formatCurrency(todaysTotal)}</strong> ({todaysBills.length})
          </span>
          <span className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-medium text-[11px] hidden md:inline">
            Cash: <strong className="font-mono">{formatCurrency(cashTotal)}</strong>
          </span>
          <span className="bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-blue-900 font-medium text-[11px] hidden md:inline">
            Online: <strong className="font-mono">{formatCurrency(onlineTotal)}</strong>
          </span>
          {udharTotal > 0 && (
            <span className="bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-amber-800 font-bold text-[11px]">
              Udhar: <strong className="font-mono">{formatCurrency(udharTotal)}</strong>
            </span>
          )}

          <label
            className="btn-secondary text-[11px] px-2 py-1 cursor-pointer inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 ml-1"
            title="Bulk upload product photos from PC"
          >
            <Upload className="w-3 h-3 text-blue-900" />
            <span>Bulk Photos</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleBulkFilesSelect}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'new' ? 'history' : 'new')}
            className={`btn-secondary text-[11px] px-2.5 py-1 cursor-pointer ${
              activeTab === 'history' ? 'bg-[#0F2942] text-white border-[#0F2942]' : ''
            }`}
          >
            <History className="w-3 h-3" />
            <span>{activeTab === 'new' ? `History (${b2bBills.length})` : 'New Bill'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        /* Fast Counter Form */
        <div className="space-y-2">
          {/* Row 1: Mechanic & Payment Mode Selection */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end text-xs">
              {/* Date (2 cols) */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Date</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="input-field text-xs py-1 px-2 font-medium"
                />
              </div>

              {/* Mechanic Name Combobox (4 cols) */}
              <div className="lg:col-span-4">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="block text-[10px] uppercase font-bold text-slate-700">
                    Mechanic Name *
                  </label>
                  {selectedMechanic && selectedMechanic.dues_balance > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      Existing Udhar: {formatCurrency(selectedMechanic.dues_balance)}
                    </span>
                  )}
                </div>
                <SearchableCombobox
                  value={mechanicName}
                  onChange={(val) => {
                    setMechanicName(val);
                    if (!val) setSelectedMechanicId('');
                  }}
                  onSelectOption={(opt) => {
                    if (opt.data) selectMechanic(opt.data);
                  }}
                  options={mechanicOptions}
                  onVoiceClick={startVoiceMechanic}
                  isListening={isListeningMech}
                  placeholder="Select or type mechanic name..."
                  inputClassName="py-1 px-2 text-xs font-semibold"
                />
              </div>

              {/* Mechanic Mobile (2 cols) */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                  Mechanic Mobile
                </label>
                <div className="relative">
                  <Phone className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={mechanicPhone}
                    onChange={(e) => setMechanicPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit number..."
                    className="input-field text-xs py-1 pl-6 pr-1.5 font-mono"
                  />
                </div>
              </div>

              {/* Amount Paid (2 cols) */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="block text-[10px] uppercase font-bold text-slate-500">
                    Amount Paid (₹)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(String(grandTotal))}
                      className="text-[9px] text-blue-700 hover:underline font-bold"
                    >
                      Full
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setPaidAmount('0')}
                      className="text-[9px] text-amber-700 hover:underline font-bold"
                    >
                      Zero
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={paymentMethod === 'Udhar' ? '0' : String(grandTotal)}
                  className="input-field text-xs py-1 px-2 font-bold text-right font-mono"
                />
              </div>

              {/* Remaining Udhar Indicator (2 cols) */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                  Remaining Udhar
                </label>
                <div
                  className={`py-1 px-2 rounded border text-xs font-mono font-bold text-right ${
                    dueAmount > 0
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {dueAmount > 0 ? formatCurrency(dueAmount) : '₹0.00 (Paid)'}
                </div>
              </div>
            </div>

            {/* Payment Method Quick Selector Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase mr-1">
                Payment Mode:
              </span>

              {/* Cash */}
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('Cash')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'Cash'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>

              {/* Online 1 */}
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('Online 1')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'Online 1'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Online 1</span>
              </button>

              {/* Online 2 */}
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('Online 2')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'Online 2'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Online 2</span>
              </button>

              {/* Online 3 */}
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('Online 3')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'Online 3'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Online 3</span>
              </button>

              {/* Udhar Button (Prominent) */}
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('Udhar')}
                className={`px-3.5 py-1 rounded text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'Udhar'
                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Udhar (Credit)</span>
              </button>

              {/* Split Payment Button */}
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('Split')}
                className={`px-3.5 py-1 rounded text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'Split'
                    ? 'bg-purple-700 text-white shadow-xs ring-2 ring-purple-300'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Split Payment</span>
              </button>

              {/* Status summary pill */}
              <div className="ml-auto text-[11px] font-semibold flex items-center gap-2">
                {paymentMethod === 'Udhar' ? (
                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    ⚠️ Udhar Mode: {dueAmount > 0 ? `${formatCurrency(dueAmount)} remaining dues` : 'Paid'}
                  </span>
                ) : paymentMethod === 'Split' ? (
                  <span className="text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                    ⚡ Split Payment Mode
                  </span>
                ) : (
                  <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ✓ Immediate Collection ({paymentMethod})
                  </span>
                )}
              </div>
            </div>

            {/* Split Breakdown Inputs in B2B */}
            {paymentMethod === 'Split' && (
              <div className="p-2.5 bg-purple-50/40 rounded-lg border border-purple-200 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mechanic Split Payment Breakdown</span>
                  </div>

                  {(() => {
                    const splitSum =
                      (splitPayment.cash || 0) +
                      (splitPayment.online1 || 0) +
                      (splitPayment.online2 || 0) +
                      (splitPayment.online3 || 0) +
                      (splitPayment.udhar || 0);
                    const diff = Math.round((grandTotal - splitSum) * 100) / 100;

                    if (Math.abs(diff) < 0.01) {
                      return (
                        <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Matched ₹{splitSum.toFixed(2)} (100%)</span>
                        </span>
                      );
                    } else if (diff > 0) {
                      return (
                        <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Remaining: ₹{diff.toFixed(2)}</span>
                        </span>
                      );
                    } else {
                      return (
                        <span className="text-[10.5px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Exceeded: ₹{Math.abs(diff).toFixed(2)}</span>
                        </span>
                      );
                    }
                  })()}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-slate-500 mb-0.5">Cash (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={splitPayment.cash ?? 0}
                      onChange={(e) =>
                        setSplitPayment((prev) => ({
                          ...prev,
                          cash: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="input-field text-xs py-1 px-1.5 font-mono font-bold text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-slate-500 mb-0.5">Online 1 (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={splitPayment.online1 ?? 0}
                      onChange={(e) =>
                        setSplitPayment((prev) => ({
                          ...prev,
                          online1: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="input-field text-xs py-1 px-1.5 font-mono font-bold text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-slate-500 mb-0.5">Online 2 (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={splitPayment.online2 ?? 0}
                      onChange={(e) =>
                        setSplitPayment((prev) => ({
                          ...prev,
                          online2: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="input-field text-xs py-1 px-1.5 font-mono font-bold text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-slate-500 mb-0.5">Online 3 (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={splitPayment.online3 ?? 0}
                      onChange={(e) =>
                        setSplitPayment((prev) => ({
                          ...prev,
                          online3: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="input-field text-xs py-1 px-1.5 font-mono font-bold text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-amber-700 mb-0.5">Udhar / Due (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={splitPayment.udhar ?? 0}
                      onChange={(e) =>
                        setSplitPayment((prev) => ({
                          ...prev,
                          udhar: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="input-field text-xs py-1 px-1.5 font-mono font-bold text-right bg-amber-50/50 border-amber-200 text-amber-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Line Items Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                <span>Part Items ({items.length})</span>
                <span className="text-[10.5px] text-slate-400 font-normal hidden sm:inline">
                  — Type to search or click ▼ dropdown for catalog parts
                </span>
              </span>

              <button
                type="button"
                onClick={addItem}
                className="btn-secondary text-[11px] py-0.5 px-2.5 font-bold flex items-center gap-1 text-blue-900 border-blue-200 bg-blue-50/60 hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Item</span>
              </button>
            </div>

            {/* Scrollable table body */}
            <div className="max-h-[180px] sm:max-h-[220px] lg:max-h-[260px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="table-header sticky top-0 z-20 text-[10.5px]">
                  <tr>
                    <th className="py-1 px-2 text-center w-10">Photo</th>
                    <th className="py-1 px-2.5">Product / Part Name *</th>
                    <th className="py-1 px-2 text-center w-16">Qty</th>
                    <th className="py-1 px-2 text-right w-24">Price (₹)</th>
                    <th className="py-1 px-2.5 text-right w-24">Total (₹)</th>
                    <th className="py-1 px-1.5 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Photo Thumbnail / Upload */}
                      <td className="py-0.5 px-2 text-center align-middle">
                        <label className="cursor-pointer group relative inline-block">
                          {item.image_data ? (
                            <img
                              src={item.image_data}
                              alt="part"
                              className="w-7 h-7 object-cover rounded border border-slate-300 shadow-2xs group-hover:opacity-75"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:text-blue-900 group-hover:border-blue-900 bg-slate-50">
                              <Camera className="w-3 h-3" />
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(idx, e)}
                            className="hidden"
                          />
                        </label>
                      </td>

                      {/* Product Name with Typeahead, Voice Search and Dropdown Chevron to show all */}
                      <td className="py-0.5 px-2.5">
                        <SearchableCombobox
                          value={item.product_name}
                          onChange={(val) => updateItemField(idx, 'product_name', val)}
                          onSelectOption={(opt) => {
                            if (opt.data) selectProduct(idx, opt.data);
                          }}
                          options={productOptions}
                          onVoiceClick={() => startVoiceProduct(idx)}
                          isListening={voiceItemIndex === idx}
                          placeholder="Type part name or click ▼ for all..."
                          inputClassName="py-0.5 px-1.5 text-xs font-semibold"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="py-0.5 px-2">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            updateItemField(idx, 'qty', parseInt(e.target.value, 10) || 1)
                          }
                          className="input-field text-xs py-0.5 text-center font-bold font-mono"
                        />
                      </td>

                      {/* Price */}
                      <td className="py-0.5 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.price}
                          onChange={(e) =>
                            updateItemField(idx, 'price', parseFloat(e.target.value) || 0)
                          }
                          className="input-field text-xs py-0.5 text-right font-bold font-mono"
                        />
                      </td>

                      {/* Line Total */}
                      <td className="py-0.5 px-2.5 text-right font-black text-slate-900 font-mono text-xs">
                        ₹{(item.total || 0).toFixed(2)}
                      </td>

                      {/* Remove Button */}
                      <td className="py-0.5 px-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Bottom Action & Totals Bar */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            {/* Left: Optional Bill Remark */}
            <div className="flex-1 w-full sm:max-w-md">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remark (e.g. Parts given in exchange, warranty)..."
                className="input-field text-xs py-1.5 px-2.5 font-medium"
              />
            </div>

            {/* Right: Totals Breakdown & Instant Save Button */}
            <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-3 text-right">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 leading-tight">Total</div>
                  <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                    {formatCurrency(grandTotal)}
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-3">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 leading-tight">Paid</div>
                  <div className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                    {formatCurrency(parsedPaid)}
                  </div>
                </div>

                {dueAmount > 0 && (
                  <div className="border-l border-slate-200 pl-3">
                    <div className="text-[10px] uppercase font-bold text-amber-700 leading-tight">Udhar Due</div>
                    <div className="text-base sm:text-lg font-black text-amber-700 font-mono">
                      {formatCurrency(dueAmount)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn-secondary text-xs px-2.5 py-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Clear inputs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveBill}
                  className="px-4 py-1.5 bg-[#0F2942] hover:bg-[#1e3a5f] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Save bill directly to history"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save B2B Bill</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* B2B Bills History Log View */
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                B2B Daily Billing History ({b2bBills.length} Bills)
              </h3>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history by bill #, mechanic, phone, part..."
                className="input-field text-xs py-1 px-2.5 w-full sm:w-72"
              />

              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className="btn-primary text-xs py-1 px-3 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Bill</span>
              </button>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No billing records found. Click &quot;New Bill&quot; to start daily counter billing.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="table-header sticky top-0 z-10 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Invoice #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Mechanic</th>
                    <th className="py-2 px-3">Items Summary</th>
                    <th className="py-2 px-3 text-center">Payment</th>
                    <th className="py-2 px-3 text-right">Total</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Remaining Udhar</th>
                    <th className="py-2 px-3 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((b) => {
                    const billDue = b.due_amount !== undefined
                      ? b.due_amount
                      : Math.max(0, b.total_amount - (b.paid_amount || 0));

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-blue-900">
                          {b.invoice_num}
                        </td>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {formatDate(b.bill_date)}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{b.mechanic_name || b.customer_name}</div>
                          {(b.mechanic_phone || b.customer_mobile) && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {b.mechanic_phone || b.customer_mobile}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 max-w-xs truncate text-slate-600">
                          {b.items.map((it) => `${it.product_name} (${it.qty})`).join(', ')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.payment_method === 'Cash'
                                ? 'bg-emerald-100 text-emerald-900'
                                : b.payment_method === 'Udhar' || b.payment_method === 'Credit'
                                ? 'bg-amber-100 text-amber-900 font-black'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {b.payment_method}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-black text-slate-900 font-mono">
                          {formatCurrency(b.total_amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700 font-mono">
                          {formatCurrency(b.paid_amount || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {billDue > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                              Udhar: {formatCurrency(billDue)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              ✓ Paid
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingBill(b)}
                              className="p-1 text-slate-400 hover:text-blue-900 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="View Slip / Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBill(b.id, b.invoice_num)}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* View Bill Slip / Receipt Modal */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  B2B Bill Receipt #{viewingBill.invoice_num}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingBill(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Content */}
            <div ref={slipPrintRef} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3 font-sans">
              {/* Slip Header */}
              <div className="text-center border-b border-slate-200 pb-2.5">
                <h4 className="text-sm font-black text-red-600 tracking-tight">STAR LINE SERVICES</h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  Shop No. 3, Anvar Estate, South Sadar Bazar, Solapur
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Ph: 7775038897 / 7776011808 | GST: 27ADEPW8222B1ZL
                </p>
                <div className="mt-1 inline-block bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.2 rounded text-[10px] font-bold uppercase">
                  B2B Trade Invoice
                </div>
              </div>

              {/* Bill Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Invoice: </span>
                  <strong className="font-mono text-slate-900">{viewingBill.invoice_num}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Date: </span>
                  <strong className="text-slate-900">{formatDate(viewingBill.bill_date)}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Mechanic: </span>
                  <strong className="text-slate-900">{viewingBill.mechanic_name || viewingBill.customer_name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Mobile: </span>
                  <strong className="font-mono text-slate-900">
                    {viewingBill.mechanic_phone || viewingBill.customer_mobile || 'N/A'}
                  </strong>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border border-slate-200 bg-white">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-1 px-2">#</th>
                    <th className="py-1 px-2">Part Item</th>
                    <th className="py-1 px-2 text-center">Qty</th>
                    <th className="py-1 px-2 text-right">Rate</th>
                    <th className="py-1 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingBill.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="py-1 px-2 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                      <td className="py-1 px-2 font-semibold text-slate-800">{it.product_name}</td>
                      <td className="py-1 px-2 text-center font-mono">{it.qty}</td>
                      <td className="py-1 px-2 text-right font-mono">₹{it.price.toFixed(2)}</td>
                      <td className="py-1 px-2 text-right font-mono font-bold">₹{it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Calculations */}
              <div className="border-t border-slate-200 pt-2 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatCurrency(viewingBill.total_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Method:</span>
                  <span className="font-semibold">{viewingBill.payment_method}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">{formatCurrency(viewingBill.paid_amount || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-800 pt-1 border-t border-dashed border-slate-300">
                  <span>Remaining Udhar Due:</span>
                  <span className="font-mono">
                    {formatCurrency(
                      viewingBill.due_amount !== undefined
                        ? viewingBill.due_amount
                        : Math.max(0, viewingBill.total_amount - (viewingBill.paid_amount || 0))
                    )}
                  </span>
                </div>
              </div>

              {viewingBill.notes && (
                <div className="p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-600">
                  <strong>Remark: </strong> {viewingBill.notes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setViewingBill(null)}
                className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleWhatsAppSlip(viewingBill)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Slip</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="btn-primary text-xs px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Images Draft Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-900" />
                <span>Bulk Add Catalog Products ({bulkDrafts.length} Photos)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Each photo will be created as an independent product in the stock inventory. Review details below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
              {bulkDrafts.map((draft, idx) => (
                <div key={draft.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <img
                    src={draft.image_data}
                    alt={draft.name}
                    className="w-full h-20 object-cover rounded border border-slate-300"
                  />
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">Product Name *</label>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBulkDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, name: val } : d))
                        );
                      }}
                      className="input-field text-xs font-semibold py-0.5 px-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={draft.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBulkDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, price: val } : d))
                          );
                        }}
                        className="input-field text-xs font-bold py-0.5 px-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={draft.qty}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBulkDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, qty: val } : d))
                          );
                        }}
                        className="input-field text-xs font-bold py-0.5 px-1.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn-secondary text-xs py-1.5 px-3 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBulkDrafts}
                className="btn-primary text-xs py-1.5 px-4 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save All Products</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
