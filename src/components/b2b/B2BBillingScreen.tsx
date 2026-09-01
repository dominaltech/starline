import React, { useState, useEffect } from 'react';
import { useDb } from '../../context/DbContext';
import { B2BBill, B2BBillItem, B2BPaymentMethod, Customer, Product } from '../../types';
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
  Check
} from 'lucide-react';

export const B2BBillingScreen: React.FC = () => {
  const {
    products,
    customers,
    workers,
    b2bBills,
    saveB2BBill,
    saveProduct,
    deleteB2BBill
  } = useDb();

  // Active view: 'new' bill or 'history'
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Form Header State
  const [billDate, setBillDate] = useState<string>(formatDateInput());
  const [mechanicName, setMechanicName] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<B2BPaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Save Success Notification Toast
  const [successToast, setSuccessToast] = useState<{ invoiceNum: string; amount: number } | null>(null);

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
  const [isListeningCust, setIsListeningCust] = useState<boolean>(false);
  const [voiceItemIndex, setVoiceItemIndex] = useState<number>(-1);

  // Bulk Image Upload Modal
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkDrafts, setBulkDrafts] = useState<
    Array<{ id: string; image_data: string; name: string; price: string; qty: string }>
  >([]);

  // History search filter
  const [historySearch, setHistorySearch] = useState<string>('');

  // Calculate Grand Total
  const grandTotal = items.reduce((sum, it) => sum + (it.total || 0), 0);

  // Update paid amount when grand total changes if it matches previous
  useEffect(() => {
    if (!paidAmount || parseFloat(paidAmount) === 0 || parseFloat(paidAmount) === grandTotal) {
      setPaidAmount(String(grandTotal));
    }
  }, [grandTotal]);

  // Options for Searchable Comboboxes (shows all entries on dropdown icon click!)
  const mechanicOptions = React.useMemo<ComboboxOption[]>(() => {
    return [
      { id: 'self', label: 'Self Counter Pickup', subLabel: 'Counter Walk-in' },
      { id: 'workshop', label: 'Workshop Service Tech', subLabel: 'Internal Workshop Repair' },
      ...workers.map((w) => ({
        id: w.id,
        label: w.name,
        subLabel: w.specialization ? `${w.specialization} (${w.phone})` : w.phone,
        badge: 'Staff'
      }))
    ];
  }, [workers]);

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

  const productOptions = React.useMemo<ComboboxOption[]>(() => {
    return products.map((p) => ({
      id: p.id,
      label: p.name,
      subLabel: `${p.sku ? `[${p.sku}] ` : ''}Stock: ${p.stock_qty} ${p.unit}`,
      badge: `₹${p.selling_price}`,
      badgeColor:
        p.stock_qty <= (p.min_stock_alert || 5)
          ? 'bg-rose-100 text-rose-900'
          : 'bg-emerald-100 text-emerald-900',
      data: p
    }));
  }, [products]);

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerMobile(c.mobile);
    setCustomerAddress(c.address || '');
  };

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

  // Voice recognition for Customer Name
  const startVoiceCustomer = () => {
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

      setIsListeningCust(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCustomerName(transcript);
        setIsListeningCust(false);
      };

      recognition.onerror = () => setIsListeningCust(false);
      recognition.onend = () => setIsListeningCust(false);

      recognition.start();
    } catch {
      setIsListeningCust(false);
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
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setMechanicName('');
    setPaidAmount('');
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

  // Save B2B Bill (Purely Saved into History — No Print popup required!)
  const handleSaveBill = () => {
    const validItems = items.filter((i) => i.product_name.trim().length > 0);
    if (validItems.length === 0) {
      alert('Please add at least one product name and price.');
      return;
    }

    const currentGrandTotal = validItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const invoiceNum = 'B2B-' + String(b2bBills.length + 1).padStart(3, '0');

    const newBill: B2BBill = {
      id: 'b2b_' + Date.now(),
      invoice_num: invoiceNum,
      bill_date: billDate,
      mechanic_name: mechanicName.trim() || 'Counter Pickup',
      customer_name: customerName.trim() || 'Walk-in Mechanic / Client',
      customer_mobile: customerMobile.trim(),
      customer_address: customerAddress.trim(),
      items: validItems,
      total_amount: currentGrandTotal,
      payment_method: paymentMethod,
      paid_amount: parseFloat(paidAmount) || currentGrandTotal,
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };

    saveB2BBill(newBill);

    // Show instant success notification banner
    setSuccessToast({ invoiceNum: newBill.invoice_num, amount: currentGrandTotal });
    setTimeout(() => setSuccessToast(null), 5000);

    // Reset Form for next customer without scrolling
    handleResetForm();
  };

  // Delete B2B Bill
  const handleDeleteBill = (id: string, invNum: string) => {
    const confirm = window.confirm(`Are you sure you want to delete Daily B2B Bill #${invNum}?`);
    if (confirm) {
      deleteB2BBill(id);
    }
  };

  // Today's metrics
  const todayStr = formatDateInput();
  const todaysBills = b2bBills.filter((b) => b.bill_date === todayStr);
  const todaysTotal = todaysBills.reduce((sum, b) => sum + b.total_amount, 0);
  const cashTotal = todaysBills
    .filter((b) => b.payment_method === 'Cash')
    .reduce((sum, b) => sum + b.total_amount, 0);
  const onlineTotal = todaysBills
    .filter((b) => b.payment_method !== 'Cash')
    .reduce((sum, b) => sum + b.total_amount, 0);

  // Filtered History
  const filteredHistory = b2bBills.filter((b) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase().trim();
    return (
      b.invoice_num.toLowerCase().includes(q) ||
      b.customer_name.toLowerCase().includes(q) ||
      b.mechanic_name.toLowerCase().includes(q) ||
      (b.customer_mobile && b.customer_mobile.includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col space-y-2">
      {/* Slim Header & Live Metric Bar (Ultra-compact, zero wasted space) */}
      <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-none">
              B2B Daily Billing
            </h2>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded hidden sm:inline">
              Daily Counter
            </span>
          </div>

          {/* Success Notification Pill (Inlined into header — ZERO vertical displacement) */}
          {successToast && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded font-semibold animate-pulse">
              <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Bill #{successToast.invoiceNum} ({formatCurrency(successToast.amount)}) saved!</span>
              <button
                type="button"
                onClick={() => setSuccessToast(null)}
                className="ml-1 text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Live Daily Metrics & Header Action Buttons */}
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
        /* Single-Screen Fast Counter Form — Guaranteed Fit on All Screen Sizes */
        <div className="space-y-2">
          {/* Row 1: Compact Customer & Counter Info (Ultra-dense single row fit) */}
          <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-end text-xs">
              {/* Date */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Date</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="input-field text-xs py-1 px-1.5 font-medium"
                />
              </div>

              {/* Mechanic / Tech */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Mechanic / Staff</label>
                <SearchableCombobox
                  value={mechanicName}
                  onChange={setMechanicName}
                  options={mechanicOptions}
                  placeholder="Staff name..."
                  inputClassName="py-0.5 px-1.5 text-xs font-semibold"
                />
              </div>

              {/* Customer Name with Voice Search & All Customers Dropdown Chevron */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Customer Name</label>
                <SearchableCombobox
                  value={customerName}
                  onChange={setCustomerName}
                  onSelectOption={(opt) => {
                    if (opt.data) selectCustomer(opt.data);
                  }}
                  options={customerOptions}
                  onVoiceClick={startVoiceCustomer}
                  isListening={isListeningCust}
                  placeholder="Client / Mechanic..."
                  inputClassName="py-0.5 px-1.5 text-xs font-semibold"
                />
              </div>

              {/* Customer Mobile */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Mobile (Optional)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit number..."
                  className="input-field text-xs py-1 px-1.5 font-mono"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as B2BPaymentMethod)}
                  className="input-field text-xs py-1 px-1.5 font-bold bg-white cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="PhonePe">PhonePe / UPI</option>
                  <option value="GPay">Google Pay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit">Credit / Udhar</option>
                </select>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={String(grandTotal)}
                  className="input-field text-xs py-1 px-1.5 font-bold text-right font-mono"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Line Items Table (Container sized so it fits completely on screen without page scroll) */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-2.5 py-1 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                <span>Part Items ({items.length})</span>
                <span className="text-[10.5px] text-slate-400 font-normal hidden sm:inline">
                  — Type to search or click ▼ dropdown for all catalog items
                </span>
              </span>

              <button
                type="button"
                onClick={addItem}
                className="btn-secondary text-[11px] py-0.5 px-2 font-bold flex items-center gap-1 text-blue-900 border-blue-200 bg-blue-50/60 hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Item</span>
              </button>
            </div>

            {/* Scrollable table body only — sized to guarantee zero screen overflow */}
            <div className="max-h-[160px] sm:max-h-[180px] lg:max-h-[220px] overflow-y-auto">
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

          {/* Row 3: Bottom Action & Totals Bar (Directly on screen with ZERO scroll!) */}
          <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-2">
            {/* Left: Optional Bill Remark */}
            <div className="flex-1 w-full sm:max-w-md">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remark (e.g. Parts given in exchange, warranty)..."
                className="input-field text-xs py-1 px-2 font-medium"
              />
            </div>

            {/* Right: Grand Total & Instant Save Button */}
            <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total:</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn-secondary text-xs px-2.5 py-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Clear inputs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveBill}
                  className="px-4 py-1.5 bg-[#0F2942] hover:bg-[#1e3a5f] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Save bill directly to history"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Bill to History</span>
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
                Daily Billing History ({b2bBills.length} Bills)
              </h3>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history by bill #, customer, mechanic..."
                className="input-field text-xs py-1 px-2.5 w-full sm:w-64"
              />

              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className="btn-primary text-xs py-1 px-3 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Bill</span>
              </button>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
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
                    <th className="py-2 px-3">Customer / Mechanic</th>
                    <th className="py-2 px-3">Items Summary</th>
                    <th className="py-2 px-3 text-center">Payment</th>
                    <th className="py-2 px-3 text-right">Grand Total</th>
                    <th className="py-2 px-3 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-blue-900">
                        {b.invoice_num}
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(b.bill_date)}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900">{b.customer_name}</div>
                        <div className="text-[10px] text-slate-400">Staff: {b.mechanic_name}</div>
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate text-slate-600">
                        {b.items.map((it) => `${it.product_name} (${it.qty})`).join(', ')}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.payment_method === 'Cash'
                              ? 'bg-emerald-100 text-emerald-900'
                              : b.payment_method === 'Credit'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {b.payment_method}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-900 font-mono">
                        {formatCurrency(b.total_amount)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteBill(b.id, b.invoice_num)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
                className="text-slate-400 hover:text-slate-700"
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
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBulkDrafts}
                className="btn-primary text-xs py-1.5 px-4"
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
