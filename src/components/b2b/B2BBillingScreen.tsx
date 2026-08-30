import React, { useState, useEffect } from 'react';
import { useDb } from '../../context/DbContext';
import { B2BBill, B2BBillItem, B2BPaymentMethod, Customer, Product } from '../../types';
import { formatDate, formatDateInput, formatCurrency } from '../../utils/formatters';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Printer,
  Save,
  Mic,
  Camera,
  Upload,
  CheckCircle,
  X,
  CreditCard,
  Phone,
  User,
  History,
  FileText,
  Clock
} from 'lucide-react';

export const B2BBillingScreen: React.FC = () => {
  const {
    products,
    customers,
    workers,
    b2bBills,
    settings,
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

  // Product Autocomplete State per Row
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);

  // Customer Autocomplete State
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [showCustDropdown, setShowCustDropdown] = useState<boolean>(false);

  // Voice Search States
  const [isListeningCust, setIsListeningCust] = useState<boolean>(false);
  const [voiceItemIndex, setVoiceItemIndex] = useState<number>(-1);

  // Print Receipt Modal
  const [printingBill, setPrintingBill] = useState<B2BBill | null>(null);

  // Bulk Image Upload Modal
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkDrafts, setBulkDrafts] = useState<
    Array<{ id: string; image_data: string; name: string; price: string; qty: string }>
  >([]);

  // Calculate Grand Total
  const grandTotal = items.reduce((sum, it) => sum + (it.total || 0), 0);

  // Update paid amount when grand total changes if it matches previous
  useEffect(() => {
    if (!paidAmount || parseFloat(paidAmount) === 0) {
      setPaidAmount(String(grandTotal));
    }
  }, [grandTotal]);

  // Customer search typeahead
  useEffect(() => {
    const q = (customerMobile || customerName).toLowerCase().trim();
    if (q.length >= 2) {
      const results = customers.filter(
        (c) => c.mobile.includes(q) || c.name.toLowerCase().includes(q)
      ).slice(0, 6);
      setCustomerSearchResults(results);
      setShowCustDropdown(results.length > 0);
    } else {
      setShowCustDropdown(false);
    }
  }, [customerMobile, customerName, customers]);

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerMobile(c.mobile);
    setCustomerAddress(c.address || '');
    setShowCustDropdown(false);
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

  const removeItem = (idx: number) => {
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
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemField = (idx: number, field: keyof B2BBillItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'price') {
          const q = field === 'qty' ? Number(value) || 0 : item.qty;
          const p = field === 'price' ? Number(value) || 0 : item.price;
          updated.total = q * p;
        }
        return updated;
      })
    );
  };

  const handleProductNameChange = (idx: number, text: string) => {
    updateItemField(idx, 'product_name', text);
    setActiveItemIndex(idx);

    if (text.trim().length >= 1) {
      const q = text.toLowerCase().trim();
      const matches = products
        .filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)))
        .slice(0, 8);
      setProductSearchResults(matches);
      setShowProductDropdown(matches.length > 0);
    } else {
      setShowProductDropdown(false);
    }
  };

  const selectProduct = (idx: number, prod: Product) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i !== idx
          ? item
          : {
              ...item,
              product_id: prod.id,
              product_name: prod.name,
              price: prod.selling_price,
              total: item.qty * prod.selling_price,
              image_data: prod.image_data || item.image_data
            }
      )
    );
    setShowProductDropdown(false);
  };

  // Image Upload for Item
  const handleItemImageUpload = (idx: number, file: File) => {
    if (file.size > 800000) {
      alert('Image should be under 800KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setItems((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, image_data: base64 } : item))
      );
    };
    reader.readAsDataURL(file);
  };

  // Voice Search for Product in Row
  const startProductVoiceSearch = (idx: number) => {
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
      recognition.maxAlternatives = 1;

      setVoiceItemIndex(idx);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleProductNameChange(idx, transcript);
        setVoiceItemIndex(-1);
      };

      recognition.onerror = () => setVoiceItemIndex(-1);
      recognition.onend = () => setVoiceItemIndex(-1);

      recognition.start();
    } catch {
      setVoiceItemIndex(-1);
    }
  };

  // Voice Search for Customer
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
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
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

  // Save B2B Bill
  const handleSaveBill = (shouldPrint = false) => {
    const validItems = items.filter((i) => i.product_name.trim().length > 0);
    if (validItems.length === 0) {
      alert('Please add at least one product with name and quantity.');
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

    const saved = saveB2BBill(newBill);

    if (shouldPrint) {
      setPrintingBill(saved);
    } else {
      alert(`B2B Daily Bill #${saved.invoice_num} saved successfully!`);
    }

    // Reset Form
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setMechanicName('');
    setPaidAmount('');
    setNotes('');
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

  // Delete B2B Bill
  const handleDeleteBill = (id: string, invNum: string) => {
    const confirm = window.confirm(`Are you sure you want to delete Daily B2B Bill #${invNum}?`);
    if (confirm) {
      deleteB2BBill(id);
    }
  };

  // Metrics for Today's B2B Billing
  const todayStr = formatDateInput();
  const todaysBills = b2bBills.filter((b) => b.bill_date === todayStr);
  const todaysTotal = todaysBills.reduce((sum, b) => sum + b.total_amount, 0);
  const cashTotal = todaysBills
    .filter((b) => b.payment_method === 'Cash')
    .reduce((sum, b) => sum + b.total_amount, 0);
  const onlineTotal = todaysBills
    .filter((b) => b.payment_method !== 'Cash')
    .reduce((sum, b) => sum + b.total_amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>B2B Daily Mechanic Billing</span>
              <span className="text-[11px] font-semibold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                Daily Counter
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Instant part bills for mechanics with per-item photos, voice search, and payment modes.
            </p>
          </div>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="btn-secondary text-xs px-3 py-2 cursor-pointer inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100">
            <Upload className="w-4 h-4 text-blue-900" />
            <span>Bulk Upload Images</span>
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
            className={`btn-secondary text-xs px-3.5 py-2 ${
              activeTab === 'history' ? 'bg-[#0F2942] text-white border-[#0F2942]' : ''
            }`}
          >
            <History className="w-4 h-4" />
            <span>{activeTab === 'new' ? `Daily Log (${b2bBills.length})` : 'New B2B Bill'}</span>
          </button>
        </div>
      </div>

      {/* Today's KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 bg-white border-l-4 border-l-blue-900">
          <div className="text-[11px] font-semibold text-slate-500">Today&apos;s Bills</div>
          <div className="text-xl font-black text-slate-900 mt-1">{todaysBills.length}</div>
        </div>

        <div className="card p-3.5 bg-white border-l-4 border-l-emerald-600">
          <div className="text-[11px] font-semibold text-slate-500">Today&apos;s Revenue</div>
          <div className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(todaysTotal)}</div>
        </div>

        <div className="card p-3.5 bg-white border-l-4 border-l-amber-500">
          <div className="text-[11px] font-semibold text-slate-500">Cash Received</div>
          <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(cashTotal)}</div>
        </div>

        <div className="card p-3.5 bg-white border-l-4 border-l-purple-600">
          <div className="text-[11px] font-semibold text-slate-500">Online / Bank</div>
          <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(onlineTotal)}</div>
        </div>
      </div>

      {activeTab === 'new' ? (
        /* New B2B Bill Form */
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-5">
          {/* Header Controls: Date, Mechanic, Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Bill Date</span>
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="input-field text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Mechanic / Staff Name</span>
              </label>
              <input
                type="text"
                list="worker-suggestions"
                value={mechanicName}
                onChange={(e) => setMechanicName(e.target.value)}
                placeholder="e.g. Asif Mechanic / Mohsin"
                className="input-field text-xs font-semibold"
              />
              <datalist id="worker-suggestions">
                {workers.map((w) => (
                  <option key={w.id} value={w.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Payment Method</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as B2BPaymentMethod)}
                className="input-field text-xs font-bold cursor-pointer"
              >
                <option value="Cash">Cash (रोख)</option>
                <option value="PhonePe">PhonePe / UPI</option>
                <option value="GPay">Google Pay (GPay)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Credit">Credit / Udhar (उधार)</option>
              </select>
            </div>
          </div>

          {/* Customer Details Row with Voice Search */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 relative">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>Customer / Mechanic Buyer Details</span>
              <span className="text-[10.5px] font-normal text-slate-500">Auto-suggests from customer base</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Customer Name with Voice Search */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Customer / Workshop Name
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Type name or speak..."
                    className="input-field text-xs pr-8 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={startCustomerVoiceSearch}
                    className={`absolute right-1.5 p-1 rounded ${
                      isListeningCust
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'text-slate-400 hover:text-blue-900'
                    }`}
                    title="Speak customer name"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Mobile Number (10-Digit)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="e.g. 9890123456"
                  className="input-field text-xs font-mono font-bold"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Address / Workshop Location
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Area / Garage name, Solapur"
                  className="input-field text-xs"
                />
              </div>
            </div>

            {/* Customer Dropdown Suggestions */}
            {showCustDropdown && customerSearchResults.length > 0 && (
              <div className="absolute top-full left-3 right-3 z-30 bg-white border border-slate-300 rounded-lg shadow-xl divide-y divide-slate-100 max-h-48 overflow-y-auto mt-1">
                {customerSearchResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <span className="text-slate-500 font-mono ml-2">({c.mobile})</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{c.address}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                B2B Spares & Items List ({items.length})
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="btn-primary text-xs py-1 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="table-header">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3 w-16 text-center">Photo</th>
                    <th className="py-2.5 px-3">Part / Product Name (Typeahead & Voice)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Quantity</th>
                    <th className="py-2.5 px-3 w-32 text-right">Price (₹)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      {/* Item Photo Upload Thumbnail */}
                      <td className="py-2 px-2 text-center">
                        {item.image_data ? (
                          <div className="relative inline-block group">
                            <img
                              src={item.image_data}
                              alt="Part"
                              className="w-9 h-9 object-cover rounded border border-slate-300 shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={() => updateItemField(idx, 'image_data', '')}
                              className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow-2xs hover:bg-rose-700"
                              title="Remove photo"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-9 h-9 bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-900 rounded border border-dashed border-slate-300 mx-auto flex items-center justify-center cursor-pointer transition-colors" title="Upload part photo from PC">
                            <Camera className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleItemImageUpload(idx, file);
                              }}
                            />
                          </label>
                        )}
                      </td>

                      {/* Product Name with Typeahead and Voice Search */}
                      <td className="py-2 px-3 relative">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={item.product_name}
                            onChange={(e) => handleProductNameChange(idx, e.target.value)}
                            placeholder="Type part name (e.g. Copper Pipe 1/4)..."
                            className="input-field text-xs pr-8 font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => startProductVoiceSearch(idx)}
                            className={`absolute right-1.5 p-1 rounded transition-all ${
                              voiceItemIndex === idx
                                ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                                : 'text-slate-400 hover:text-blue-900'
                            }`}
                            title="Speak part name"
                          >
                            <Mic className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Product Typeahead Dropdown */}
                        {showProductDropdown && activeItemIndex === idx && productSearchResults.length > 0 && (
                          <div className="absolute top-full left-3 right-3 z-40 bg-white border border-slate-300 rounded-lg shadow-xl divide-y divide-slate-100 max-h-48 overflow-y-auto mt-1">
                            {productSearchResults.map((prod) => (
                              <div
                                key={prod.id}
                                onClick={() => selectProduct(idx, prod)}
                                className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs"
                              >
                                <div>
                                  <span className="font-bold text-slate-900">{prod.name}</span>
                                  <span className="text-slate-400 text-[11px] ml-2">({prod.unit})</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-blue-900">₹{prod.selling_price}</span>
                                  <span className="text-[10px] text-slate-400 ml-2">
                                    Stock: {prod.stock_qty}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            updateItemField(idx, 'qty', parseInt(e.target.value, 10) || 1)
                          }
                          className="input-field text-xs text-center font-bold font-mono"
                        />
                      </td>

                      {/* Price */}
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.price}
                          onChange={(e) =>
                            updateItemField(idx, 'price', parseFloat(e.target.value) || 0)
                          }
                          className="input-field text-xs text-right font-bold"
                        />
                      </td>

                      {/* Line Total */}
                      <td className="py-2 px-3 text-right font-black text-slate-900">
                        ₹{(item.total || 0).toFixed(2)}
                      </td>

                      {/* Remove Button */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Bar: Notes, Totals & Save Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Bill Notes / Additional Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Parts given on exchange of defective item..."
                className="input-field text-xs"
              />
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Grand Total:</span>
                <span className="text-xl font-black text-slate-900">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Amount Received (₹):</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-32 text-right input-field text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveBill(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  <Save className="w-4 h-4 text-blue-900" />
                  <span>Save Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBill(true)}
                  className="btn-primary text-xs px-5 py-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save & Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* B2B Bills History Log Table */
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">
              B2B Daily Billing Records ({b2bBills.length})
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className="btn-primary text-xs py-1 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Bill</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="table-header">
                <tr>
                  <th className="py-2.5 px-3">Slip #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Mechanic</th>
                  <th className="py-2.5 px-3">Customer & Phone</th>
                  <th className="py-2.5 px-3">Items Sold</th>
                  <th className="py-2.5 px-3 text-center">Payment</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {b2bBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      No B2B bills recorded yet.
                    </td>
                  </tr>
                ) : (
                  b2bBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold font-mono text-red-600">
                        {bill.invoice_num}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {formatDate(bill.bill_date)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {bill.mechanic_name || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{bill.customer_name}</div>
                        <div className="text-[10.5px] font-mono text-slate-400">
                          {bill.customer_mobile || '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                        {bill.items.map((it) => `${it.product_name} (${it.qty})`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            bill.payment_method === 'Cash'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {bill.payment_method}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintingBill(bill)}
                            className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded"
                            title="Print Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBill(bill.id, bill.invoice_num)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Bill"
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
      )}

      {/* Printable Receipt Modal */}
      {printingBill && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-900" />
                <span>B2B Slip #{printingBill.invoice_num}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPrintingBill(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip Printable Body */}
            <div className="border border-slate-300 rounded p-4 bg-white text-xs space-y-3 font-sans">
              <div className="text-center border-b border-slate-200 pb-2">
                <h2 className="text-base font-black text-slate-900">{settings.shop_name}</h2>
                <p className="text-[10px] text-slate-500">{settings.address_line1} {settings.city}</p>
                <p className="text-[10px] font-mono">Mobile: {settings.mobiles}</p>
                <div className="mt-1 text-[11px] font-bold text-red-700">
                  B2B DAILY MECHANIC CASH SLIP
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Slip No:</span>{' '}
                  <strong className="font-mono">{printingBill.invoice_num}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Date:</span>{' '}
                  <strong>{formatDate(printingBill.bill_date)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Mechanic:</span>{' '}
                  <strong>{printingBill.mechanic_name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Payment:</span>{' '}
                  <strong>{printingBill.payment_method}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Customer:</span>{' '}
                  <strong>{printingBill.customer_name}</strong> ({printingBill.customer_mobile || '-'})
                </div>
              </div>

              <table className="w-full text-[11px] border-t border-b border-slate-200 py-1">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-1 text-left">Item</th>
                    <th className="py-1 text-center w-12">Qty</th>
                    <th className="py-1 text-right w-16">Price</th>
                    <th className="py-1 text-right w-16">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {printingBill.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1 font-medium">{it.product_name}</td>
                      <td className="py-1 text-center font-mono">{it.qty}</td>
                      <td className="py-1 text-right">₹{it.price}</td>
                      <td className="py-1 text-right font-bold">₹{it.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center text-sm font-black pt-1">
                <span>Grand Total:</span>
                <span>{formatCurrency(printingBill.total_amount)}</span>
              </div>

              <div className="text-[10px] text-slate-400 italic text-center pt-2">
                Thank you! All parts sold on replacement guarantee.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPrintingBill(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary text-xs px-4"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Images Draft Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
              {bulkDrafts.map((draft, idx) => (
                <div key={draft.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <img
                    src={draft.image_data}
                    alt={draft.name}
                    className="w-full h-24 object-cover rounded border border-slate-300"
                  />
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBulkDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, name: val } : d))
                        );
                      }}
                      className="input-field text-xs font-semibold py-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                        className="input-field text-xs font-bold py-1"
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
                        className="input-field text-xs font-bold py-1"
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
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBulkDrafts}
                className="btn-primary text-xs px-4"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save All Products</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
