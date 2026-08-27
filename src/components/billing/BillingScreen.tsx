import React, { useState, useEffect } from 'react';
import { useDb } from '../../context/DbContext';
import { Bill, BillItem, BillType, Customer, Product } from '../../types';
import { numberToIndianWords } from '../../utils/numberToWords';
import { formatDateInput } from '../../utils/formatters';
import { BillPrintTemplate } from './BillPrintTemplate';
import {
  Plus,
  Trash2,
  Printer,
  Save,
  RotateCcw,
  Search,
  CheckCircle,
  FileCheck,
  X
} from 'lucide-react';

interface BillingScreenProps {
  onBillCreated?: (bill: Bill) => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({ onBillCreated }) => {
  const { settings, products, workers, createBill, customers } = useDb();

  // Mode: Estimate (Non-GST) vs GST
  const [billType, setBillType] = useState<BillType>('ESTIMATE');

  // Form Header State
  const [invoiceNum, setInvoiceNum] = useState<string>(String(settings.starting_invoice_num || 981));
  const [invoiceDate, setInvoiceDate] = useState<string>(formatDateInput());

  // Customer & Appliance State
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerGstin, setCustomerGstin] = useState<string>('');
  const [customerDues, setCustomerDues] = useState<number>(0);

  // Appliance info
  const [productNameDesc, setProductNameDesc] = useState<string>('Refrigerator');
  const [brandModelNo, setBrandModelNo] = useState<string>('');
  const [amcStartDate, setAmcStartDate] = useState<string>('');
  const [amcEndDate, setAmcEndDate] = useState<string>('');

  // Assigned Worker
  const [assignedWorkerId, setAssignedWorkerId] = useState<string>('');

  // Payment info
  const [paidAmount, setPaidAmount] = useState<string>('');

  // Conditions
  const [conditions, setConditions] = useState<string>(settings.default_conditions);

  // Customer search typeahead state
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);

  // Items State
  const [items, setItems] = useState<BillItem[]>([
    {
      id: 'item_1',
      bill_id: '',
      sr_no: 1,
      item_description: '',
      qty: 1,
      rate: 0,
      discount: 0,
      tax_rate: 18,
      taxable_value: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      amount: 0,
      job_status: 'WORK_DONE'
    }
  ]);

  // Product typeahead active row
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);

  // Print Preview Modal State
  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Update invoice num when settings change
  useEffect(() => {
    if (settings.starting_invoice_num) {
      setInvoiceNum(String(settings.starting_invoice_num));
    }
  }, [settings.starting_invoice_num]);

  // Debounced Customer Search
  useEffect(() => {
    if (!customerSearchQuery || customerSearchQuery.trim().length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    const q = customerSearchQuery.toLowerCase().trim();
    const matches = customers.filter(
      c => c.mobile.includes(q) || c.name.toLowerCase().includes(q)
    );
    setCustomerSearchResults(matches);
    setShowCustomerDropdown(matches.length > 0);
  }, [customerSearchQuery, customers]);

  const selectCustomer = (c: Customer) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerMobile(c.mobile);
    setCustomerAddress(c.address || '');
    setCustomerGstin(c.gstin || '');
    setCustomerDues(c.dues_balance || 0);
    setCustomerSearchQuery(c.name);
    setShowCustomerDropdown(false);
  };

  // Product Search on Item Description Change
  const handleItemDescriptionChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].item_description = value;
    setItems(newItems);
    setActiveItemIndex(index);

    if (value.trim().length >= 1) {
      const q = value.toLowerCase().trim();
      const matches = products.filter(
        p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
      );
      setProductSearchResults(matches);
      setShowProductDropdown(matches.length > 0);
    } else {
      setShowProductDropdown(false);
    }
  };

  const selectProduct = (index: number, prod: Product) => {
    const newItems = [...items];
    newItems[index].product_id = prod.id;
    newItems[index].item_description = prod.name;
    newItems[index].hsn_code = prod.hsn_code || '84159000';
    newItems[index].rate = prod.selling_price || 0;
    
    // Recalculate amount
    calculateItemAmount(newItems, index);
    setItems(newItems);
    setShowProductDropdown(false);
    setActiveItemIndex(null);
  };

  // Handle Numeric Field Changes
  const handleItemNumericChange = (
    index: number,
    field: 'qty' | 'rate' | 'discount' | 'amount',
    val: number
  ) => {
    const newItems = [...items];
    if (field === 'qty') newItems[index].qty = Math.max(1, val);
    if (field === 'rate') newItems[index].rate = Math.max(0, val);
    if (field === 'discount') newItems[index].discount = Math.max(0, Math.min(100, val));
    if (field === 'amount') newItems[index].amount = Math.max(0, val);

    calculateItemAmount(newItems, index);
    setItems(newItems);
  };

  const calculateItemAmount = (itemList: BillItem[], index: number) => {
    const item = itemList[index];
    if (billType === 'ESTIMATE') {
      // In Estimate mode, amount can be rate * qty or manually entered
      if (item.rate > 0) {
        item.amount = item.rate * item.qty;
      }
      item.taxable_value = item.amount;
      item.cgst_amount = 0;
      item.sgst_amount = 0;
    } else {
      // GST Mode
      const baseVal = (item.rate || 0) * (item.qty || 1);
      const discountVal = (baseVal * (item.discount || 0)) / 100;
      const taxable = Math.max(0, baseVal - discountVal);
      
      const taxRt = item.tax_rate || 18;
      const halfRate = taxRt / 2;
      const cgst = (taxable * halfRate) / 100;
      const sgst = (taxable * halfRate) / 100;

      item.taxable_value = Math.round(taxable * 100) / 100;
      item.cgst_amount = Math.round(cgst * 100) / 100;
      item.sgst_amount = Math.round(sgst * 100) / 100;
      item.amount = Math.round((taxable + cgst + sgst) * 100) / 100;
    }
  };

  // Recalculate all items when billType toggles
  useEffect(() => {
    const updated = [...items];
    updated.forEach((_, idx) => calculateItemAmount(updated, idx));
    setItems(updated);
  }, [billType]);

  // Add & Remove Line Items
  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: 'item_' + Date.now(),
        bill_id: '',
        sr_no: items.length + 1,
        item_description: '',
        qty: 1,
        rate: 0,
        discount: 0,
        tax_rate: 18,
        taxable_value: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        amount: 0,
        job_status: 'WORK_DONE'
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sr_no: i + 1 }));
    setItems(updated);
  };

  // Aggregate Calculations
  const isGST = billType === 'GST';
  const subtotal = items.reduce((acc, it) => acc + (billType === 'ESTIMATE' ? it.amount : (it.rate * it.qty)), 0);
  const totalTaxable = items.reduce((acc, it) => acc + it.taxable_value, 0);
  const totalCgst = isGST ? items.reduce((acc, it) => acc + it.cgst_amount, 0) : 0;
  const totalSgst = isGST ? items.reduce((acc, it) => acc + it.sgst_amount, 0) : 0;
  const grandTotal = isGST ? (totalTaxable + totalCgst + totalSgst) : subtotal;
  const wordsAmount = numberToIndianWords(grandTotal);

  // Form Validation & Save
  const handleSaveBill = (andPrint = false) => {
    if (!customerName.trim()) {
      alert('Please enter or select a customer name.');
      return;
    }

    const validItems = items.filter(it => it.item_description && it.item_description.trim().length > 0);
    if (validItems.length === 0) {
      alert('Please add at least one spare part or service description.');
      return;
    }

    const assignedWorker = workers.find(w => w.id === assignedWorkerId);
    const paidVal = paidAmount ? parseFloat(paidAmount) : grandTotal;
    const paymentStatus = paidVal >= grandTotal ? 'PAID' : paidVal > 0 ? 'PARTIAL' : 'UNPAID';

    const billData: Omit<Bill, 'id' | 'created_at'> = {
      invoice_num: invoiceNum.trim() || '981',
      bill_type: billType,
      invoice_date: invoiceDate,
      customer_id: customerId || undefined,
      customer_name: customerName.trim(),
      customer_mobile: customerMobile.trim(),
      customer_address: customerAddress.trim(),
      customer_gstin: customerGstin.trim(),
      product_name_desc: productNameDesc.trim(),
      brand_model_no: brandModelNo.trim(),
      amc_start_date: amcStartDate,
      amc_end_date: amcEndDate,
      items: validItems,
      subtotal: Math.round(subtotal * 100) / 100,
      total_discount: 0,
      taxable_value: Math.round(totalTaxable * 100) / 100,
      cgst_amount: Math.round(totalCgst * 100) / 100,
      sgst_amount: Math.round(totalSgst * 100) / 100,
      grand_total: Math.round(grandTotal * 100) / 100,
      words_amount: wordsAmount,
      condition_apply: conditions,
      assigned_worker_id: assignedWorkerId || undefined,
      assigned_worker_name: assignedWorker?.name || undefined,
      payment_status: paymentStatus,
      paid_amount: paidVal,
      due_amount: Math.max(0, grandTotal - paidVal)
    };

    const saved = createBill(billData);
    setSaveSuccessMsg(`Invoice #${saved.invoice_num} generated successfully!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);

    if (onBillCreated) onBillCreated(saved);

    if (andPrint) {
      setPreviewBill(saved);
      setShowPrintModal(true);
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setCustomerGstin('');
    setCustomerDues(0);
    setCustomerSearchQuery('');
    setBrandModelNo('');
    setAmcStartDate('');
    setAmcEndDate('');
    setPaidAmount('');
    setItems([
      {
        id: 'item_' + Date.now(),
        bill_id: '',
        sr_no: 1,
        item_description: '',
        qty: 1,
        rate: 0,
        discount: 0,
        tax_rate: 18,
        taxable_value: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        amount: 0,
        job_status: 'WORK_DONE'
      }
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Mode Selector & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-xs">
        {/* Tab switch: Estimate vs GST */}
        <div className="flex bg-slate-100 p-1 rounded-md">
          <button
            onClick={() => setBillType('ESTIMATE')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-xs font-bold transition-all text-center ${
              billType === 'ESTIMATE'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Estimate (Non-GST)
          </button>
          <button
            onClick={() => setBillType('GST')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-xs font-bold transition-all text-center ${
              billType === 'GST'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GST Tax Invoice (18%)
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 font-semibold animate-pulse">
            <CheckCircle className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Save and Print Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={resetForm}
            className="btn-secondary text-xs px-3 py-2 flex-1 sm:flex-none justify-center"
            title="Clear current form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={() => handleSaveBill(false)}
            className="btn-secondary text-xs px-3 py-2 text-slate-800 flex-1 sm:flex-none justify-center"
          >
            <Save className="w-3.5 h-3.5 text-blue-900" />
            <span>Save</span>
          </button>
          <button
            onClick={() => handleSaveBill(true)}
            className="btn-primary text-xs px-4 py-2 flex-1 sm:flex-none justify-center"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Save & Print</span>
          </button>
        </div>
      </div>

      {/* Main Bill Container — Replicating physical pad layout */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
        {/* Bill Pad Top Header */}
        <div className="p-4 sm:p-6 bg-slate-50/60 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div>
              <div className="flex items-center gap-2 text-red-600 font-black text-lg sm:text-xl tracking-tight font-serif">
                <span className="text-xl sm:text-2xl">★</span>
                <span>{settings.shop_name}</span>
              </div>
              <div className="text-xs text-slate-700 font-medium mt-0.5">
                {settings.address_line1} {settings.address_line2}
              </div>
              <div className="text-xs italic text-slate-600 mt-0.5">{settings.tagline}</div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs font-bold text-slate-800">Mob : {settings.mobiles}</div>
              {isGST && (
                <div className="text-xs font-mono font-bold text-red-700 mt-0.5">
                  GSTIN : {settings.gstin}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-sm font-black tracking-wider uppercase underline text-slate-900">
              {isGST ? 'TAX INVOICE / CUM RECEIPT' : 'INVOICE / CUM RECEIPT'}
            </h2>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-700">Date:</span>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-700">Invoice No:</span>
                <input
                  type="text"
                  value={invoiceNum}
                  onChange={(e) => setInvoiceNum(e.target.value)}
                  className="w-20 border border-slate-300 rounded px-2 py-1 text-xs font-bold text-red-600 focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Appliance Details Form */}
        <div className="p-6 border-b border-slate-200 bg-white space-y-4">
          {/* Customer Search & Name Block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Received with thanks from (Customer Name & Search)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type name or mobile to auto-suggest / auto-create..."
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setCustomerSearchQuery(e.target.value);
                  }}
                  onFocus={() => {
                    if (customerSearchQuery.length >= 2 && customerSearchResults.length > 0) {
                      setShowCustomerDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowCustomerDropdown(false), 200);
                  }}
                  className="input-field pr-8 font-semibold"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>

              {/* Customer autocomplete dropdown */}
              {showCustomerDropdown && customerSearchResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-slate-300 rounded-md shadow-2xl mt-1 max-h-48 overflow-y-auto ring-1 ring-black/10">
                  {customerSearchResults.map((c) => (
                    <div
                      key={c.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectCustomer(c);
                      }}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="text-slate-500 ml-2 font-mono">{c.mobile}</span>
                        {c.address && <div className="text-[11px] text-slate-400">{c.address}</div>}
                      </div>
                      {c.dues_balance > 0 && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Dues: ₹{c.dues_balance}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / Mob :</label>
              <input
                type="text"
                placeholder="10-digit mobile number"
                value={customerMobile}
                onChange={(e) => {
                  setCustomerMobile(e.target.value);
                  setCustomerSearchQuery(e.target.value);
                }}
                className="input-field font-mono font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Address :</label>
              <input
                type="text"
                placeholder="Street address, colony, landmark"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            {isGST && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer GSTIN (For B2B Billing) :
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27AAACA9593P1ZV"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  className="input-field font-mono text-xs uppercase"
                />
              </div>
            )}

            {customerDues > 0 && (
              <div className="flex items-center text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
                <span>Existing Outstanding Dues: <strong>₹{customerDues.toFixed(2)}</strong></span>
              </div>
            )}
          </div>

          {/* Appliance & AMC Details Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Products Name :</label>
              <input
                type="text"
                placeholder="e.g. Refrigerator / AC / Washing Machine"
                value={productNameDesc}
                onChange={(e) => setProductNameDesc(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Model No :</label>
              <input
                type="text"
                placeholder="e.g. LG 190L / Voltas 1.5T"
                value={brandModelNo}
                onChange={(e) => setBrandModelNo(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">AMC Start Date :</label>
              <input
                type="date"
                value={amcStartDate}
                onChange={(e) => setAmcStartDate(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">AMC End Date :</label>
              <input
                type="date"
                value={amcEndDate}
                onChange={(e) => setAmcEndDate(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>
        </div>

        {/* SPARES REPLACED Table */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              SPARES REPLACED
            </h3>
            <span className="text-[11px] text-slate-500 italic">
              Items typed on-the-fly will automatically create new catalog items upon saving.
            </span>
          </div>

          <div className="border border-slate-300 rounded-md overflow-visible relative">
            <table className="w-full text-xs text-left">
              <thead className="table-header">
                <tr>
                  <th className="py-2.5 px-2 w-10 text-center">Sr.</th>
                  <th className="py-2.5 px-3">ITEM DESCRIPTION (Typeahead & Quick-Add)</th>
                  {isGST && (
                    <>
                      <th className="py-2.5 px-2 w-24 text-right">RATE (₹)</th>
                      <th className="py-2.5 px-2 w-20 text-right">DISC %</th>
                    </>
                  )}
                  <th className="py-2.5 px-2 w-16 text-center">QTY.</th>
                  <th className="py-2.5 px-3 w-28 text-right">AMOUNT (₹)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/60 relative">
                    <td className="py-2 px-2 text-center font-bold text-slate-600">{index + 1}</td>

                    <td className="py-2 px-3 relative">
                      <input
                        type="text"
                        placeholder="Search spare or type free-text..."
                        value={item.item_description}
                        onChange={(e) => handleItemDescriptionChange(index, e.target.value)}
                        onFocus={() => {
                          setActiveItemIndex(index);
                          if (item.item_description.length > 0) {
                            const q = item.item_description.toLowerCase().trim();
                            const matches = products.filter(p => p.name.toLowerCase().includes(q));
                            setProductSearchResults(matches);
                            setShowProductDropdown(matches.length > 0);
                          }
                        }}
                        onBlur={() => {
                          // Short delay to allow onMouseDown to execute
                          setTimeout(() => {
                            setShowProductDropdown(false);
                          }, 200);
                        }}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-900 font-medium"
                      />

                      {/* Floating Product Dropdown over table & empty space */}
                      {showProductDropdown && activeItemIndex === index && productSearchResults.length > 0 && (
                        <div className="absolute z-50 left-3 min-w-[340px] max-w-lg bg-white border border-slate-300 rounded-lg shadow-2xl mt-1 max-h-52 overflow-y-auto divide-y divide-slate-100 ring-1 ring-black/10">
                          {productSearchResults.map((p) => (
                            <div
                              key={p.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectProduct(index, p);
                              }}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs transition-colors"
                            >
                              <div>
                                <div className="font-bold text-slate-800">{p.name}</div>
                                <div className="text-[10.5px] text-slate-400 font-mono flex items-center gap-2">
                                  {p.sku && <span>SKU: {p.sku}</span>}
                                  {p.hsn_code && <span>HSN: {p.hsn_code}</span>}
                                  <span className="text-emerald-700 font-medium">Stock: {p.stock_qty} {p.unit}</span>
                                </div>
                              </div>
                              <span className="font-extrabold text-slate-900 text-sm ml-3 shrink-0">
                                ₹{p.selling_price}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {isGST && (
                      <>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate || ''}
                            onChange={(e) => handleItemNumericChange(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 border border-slate-300 rounded text-xs font-medium"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount || ''}
                            onChange={(e) => handleItemNumericChange(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 border border-slate-300 rounded text-xs"
                          />
                        </td>
                      </>
                    )}

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemNumericChange(index, 'qty', parseInt(e.target.value, 10) || 1)}
                        className="w-full text-center px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
                      />
                    </td>

                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {billType === 'ESTIMATE' ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.amount || ''}
                          onChange={(e) => handleItemNumericChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full text-right px-2 py-1 border border-slate-300 rounded text-xs font-bold"
                        />
                      ) : (
                        `₹${item.amount.toFixed(2)}`
                      )}
                    </td>

                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => removeItemRow(index)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-3">
            <button
              onClick={addItemRow}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>

            {/* Totals Breakdown */}
            <div className="w-72 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              {isGST ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-semibold">₹{totalTaxable.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%):</span>
                    <span className="font-semibold">₹{totalCgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%):</span>
                    <span className="font-semibold">₹{totalSgst.toFixed(2)}</span>
                  </div>
                </>
              ) : null}

              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Configuration Block */}
        <div className="p-6 bg-slate-50/70 border-t border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rupees in Word :</label>
            <div className="p-2 bg-white rounded border border-slate-300 text-xs font-semibold italic text-slate-800">
              {wordsAmount}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Technician / Worker :
              </label>
              <select
                value={assignedWorkerId}
                onChange={(e) => setAssignedWorkerId(e.target.value)}
                className="input-field text-xs font-medium cursor-pointer"
              >
                <option value="">-- None (Counter Pickup) --</option>
                {workers.filter(w => w.is_active).map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.specialization || w.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Received (₹) :
              </label>
              <input
                type="number"
                placeholder={`Default: ₹${grandTotal}`}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="input-field text-xs font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Terms & Conditions :
              </label>
              <textarea
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="input-field text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* A5 Print & PDF Preview Modal */}
      {showPrintModal && previewBill && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-900" />
                <span>Print Preview — Invoice #{previewBill.invoice_num}</span>
              </h3>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Render Printable Template */}
            <div className="border border-slate-200 rounded p-2 max-h-[70vh] overflow-y-auto bg-slate-100/50">
              <BillPrintTemplate bill={previewBill} settings={settings} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  resetForm();
                }}
                className="btn-secondary text-xs"
              >
                Done
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Printer (A5)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
