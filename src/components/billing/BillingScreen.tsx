import React, { useState, useEffect, useRef } from 'react';
import { useDb } from '../../context/DbContext';
import { useLanguage } from '../../context/LanguageContext';
import { Bill, BillItem, BillType, Customer, Product } from '../../types';
import { numberToIndianWords } from '../../utils/numberToWords';
import { formatDateInput, formatDate } from '../../utils/formatters';
import { SearchableCombobox, ComboboxOption } from '../common/SearchableCombobox';
import { BillPrintTemplate } from './BillPrintTemplate';
import { WhatsAppModal } from '../common/WhatsAppModal';
import { interpolateTemplate } from '../../utils/whatsapp';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Plus,
  Trash2,
  Printer,
  Save,
  RotateCcw,
  Search,
  CheckCircle,
  FileCheck,
  X,
  Download,
  Image as ImageIcon,
  MessageCircle,
  Globe
} from 'lucide-react';

interface BillingScreenProps {
  onBillCreated?: (bill: Bill) => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({ onBillCreated }) => {
  const { settings, products, workers, createBill, customers } = useDb();
  const { t } = useLanguage();

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

  // Assigned Worker
  const [assignedWorkerId, setAssignedWorkerId] = useState<string>('');

  // Payment info
  const [paidAmount, setPaidAmount] = useState<string>('');

  // Conditions
  const [conditions, setConditions] = useState<string>(settings.default_conditions);

  // Customer search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');

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

  const productOptions = React.useMemo<ComboboxOption[]>(() => {
    return products.map((p) => ({
      id: p.id,
      label: p.name,
      subLabel: `${p.sku ? `[${p.sku}] ` : ''}${p.hsn_code ? `HSN: ${p.hsn_code} | ` : ''}Stock: ${p.stock_qty} ${p.unit}`,
      badge: `₹${p.selling_price}`,
      badgeColor:
        p.stock_qty <= (p.min_stock_alert || 5)
          ? 'bg-rose-100 text-rose-900'
          : 'bg-emerald-100 text-emerald-900',
      data: p
    }));
  }, [products]);

  const workerOptions = React.useMemo<ComboboxOption[]>(() => {
    return [
      { id: '', label: 'Unassigned', subLabel: 'No technician assigned' },
      ...workers.filter(w => w.is_active).map((w) => ({
        id: w.id,
        label: w.name,
        subLabel: w.specialization ? `${w.specialization} (${w.phone})` : w.phone,
        badge: 'Staff'
      }))
    ];
  }, [workers]);

  const assignedWorkerName = workers.find(w => w.id === assignedWorkerId)?.name || '';

  // Print Preview Modal State
  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [waModalData, setWaModalData] = useState<{
    isOpen: boolean;
    name: string;
    phone: string;
    message: string;
  } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [waLanguage, setWaLanguage] = useState<'mr' | 'hi' | 'en'>('mr');
  const printRef = useRef<HTMLDivElement>(null);

  // Update invoice num when settings change
  useEffect(() => {
    if (settings.starting_invoice_num) {
      setInvoiceNum(String(settings.starting_invoice_num));
    }
  }, [settings.starting_invoice_num]);

  const selectCustomer = (c: Customer) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerMobile(c.mobile);
    setCustomerAddress(c.address || '');
    setCustomerGstin(c.gstin || '');
    setCustomerDues(c.dues_balance || 0);
    setCustomerSearchQuery(c.name);
  };

  // Product Selection on Item Description Change
  const handleItemDescriptionChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].item_description = value;
    setItems(newItems);
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

  // Download PNG Image
  const handleDownloadImage = async () => {
    if (!printRef.current || !previewBill) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `StarLine_Bill_${previewBill.invoice_num}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Image export failed:', e);
      alert('Failed to generate image');
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!printRef.current || !previewBill) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`StarLine_Bill_${previewBill.invoice_num}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Failed to generate PDF');
    }
  };

  // Build WhatsApp Message using configurable templates from Settings
  const buildBillWhatsAppMessage = (bill: Bill, lang: 'mr' | 'hi' | 'en'): string => {
    const itemsList = bill.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.item_description} × ${it.qty} = ₹${it.amount.toFixed(2)}`
      )
      .join('\n');

    let template = settings.msg_template_bill_en || '';
    if (lang === 'mr') {
      template = settings.msg_template_bill_mr || template;
    } else if (lang === 'hi') {
      template = settings.msg_template_bill_hi || template;
    }

    const applianceLine = bill.product_name_desc
      ? `उपकरण / Appliance: ${bill.product_name_desc} ${bill.brand_model_no || ''}\n`
      : '';

    return interpolateTemplate(template, {
      shop_name: settings.shop_name,
      mobiles: settings.mobiles,
      invoice_num: bill.invoice_num,
      invoice_date: formatDate(bill.invoice_date),
      customer_name: bill.customer_name,
      appliance_line: applianceLine,
      items_list: itemsList,
      grand_total: bill.grand_total.toFixed(2),
      paid_amount: bill.paid_amount.toFixed(2),
      due_amount: bill.due_amount.toFixed(2)
    });
  };

  const handleSendWhatsApp = () => {
    if (!previewBill) return;
    const msg = buildBillWhatsAppMessage(previewBill, waLanguage);
    setWaModalData({
      isOpen: true,
      name: previewBill.customer_name,
      phone: previewBill.customer_mobile,
      message: msg
    });
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
      {/* Top Action Bar with Mode Switcher & Direct Action Triggers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button
              type="button"
              onClick={() => setBillType('ESTIMATE')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                billType === 'ESTIMATE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('bill_mode_estimate')}
            </button>
            <button
              type="button"
              onClick={() => setBillType('GST')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                billType === 'GST'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('bill_mode_gst')}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs border-l border-slate-200 pl-2.5">
            <span className="font-semibold text-slate-600">{t('bill_invoice_no')}:</span>
            <input
              type="text"
              value={invoiceNum}
              onChange={(e) => setInvoiceNum(e.target.value)}
              className="w-16 sm:w-20 border border-slate-300 rounded px-2 py-1 text-xs font-bold text-red-600 text-center"
            />

            <span className="font-semibold text-slate-600 ml-1">{t('bill_date')}:</span>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-medium"
            />
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{t('bill_saved_success')}</span>
          </div>
        )}

        {/* Save and Print Buttons Right at Top */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={resetForm}
            className="btn-secondary text-xs px-3 py-1.5"
            title="Clear current form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('action_clear')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveBill(false)}
            className="btn-secondary text-xs px-3.5 py-1.5 text-slate-800 font-semibold"
          >
            <Save className="w-3.5 h-3.5 text-blue-900" />
            <span>{t('action_save')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveBill(true)}
            className="btn-primary text-xs px-4 py-1.5 bg-[#0F2942] hover:bg-[#1e3a5f] text-white shadow-xs"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>{t('action_save_print')}</span>
          </button>
        </div>
      </div>

      {/* Main Bill Container — Compact Front Section + Extended Details Below */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
        {/* Front Section: Compact Customer & Appliance Details */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Customer Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t('bill_cust_name_label')} *</span>
                {customerDues > 0 && (
                  <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                    Dues: ₹{customerDues.toFixed(0)}
                  </span>
                )}
              </label>
              <SearchableCombobox
                value={customerName}
                onChange={(val) => {
                  setCustomerName(val);
                  setCustomerSearchQuery(val);
                }}
                onSelectOption={(opt) => {
                  if (opt.data) selectCustomer(opt.data);
                }}
                options={customerOptions}
                placeholder={t('bill_cust_search_placeholder')}
                inputClassName="py-1 px-2 text-xs font-semibold"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('bill_mobile_no')} :</label>
              <input
                type="text"
                placeholder="10-digit number"
                value={customerMobile}
                onChange={(e) => {
                  setCustomerMobile(e.target.value);
                  setCustomerSearchQuery(e.target.value);
                }}
                className="input-field text-xs py-1 px-2 font-mono font-medium"
              />
            </div>

            {/* Appliance */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('bill_appliance')} :</label>
              <input
                type="text"
                placeholder="e.g. Refrigerator / AC"
                value={productNameDesc}
                onChange={(e) => setProductNameDesc(e.target.value)}
                className="input-field text-xs py-1 px-2 font-medium"
              />
            </div>

            {/* Brand / Model */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('bill_brand_model')} :</label>
              <input
                type="text"
                placeholder="e.g. LG 190L / Voltas 1.5T"
                value={brandModelNo}
                onChange={(e) => setBrandModelNo(e.target.value)}
                className="input-field text-xs py-1 px-2 font-medium"
              />
            </div>
          </div>

          {/* Optional Address & GSTIN row (compact) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-0.5">
            <div className={isGST ? "lg:col-span-3" : "lg:col-span-4"}>
              <input
                type="text"
                placeholder="Customer Address / Location..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="input-field text-xs py-1 px-2"
              />
            </div>
            {isGST && (
              <div>
                <input
                  type="text"
                  placeholder="GSTIN (e.g. 27AAACA9593P1ZV)"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  className="input-field font-mono text-xs uppercase py-1 px-2"
                />
              </div>
            )}
          </div>
        </div>

        {/* Front Section: SPARES REPLACED Table */}
        <div className="p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>{t('bill_spares_section')}</span>
              <span className="text-[10.5px] font-normal text-slate-400 capitalize">
                ({items.length} items added)
              </span>
            </h3>
            <span className="text-[10.5px] text-slate-400 italic hidden sm:inline">
              Click ▼ in item box to browse entire catalog
            </span>
          </div>

          <div className="border border-slate-300 rounded-md overflow-visible relative">
            <table className="w-full text-xs text-left">
              <thead className="table-header">
                <tr>
                  <th className="py-2 px-2 w-10 text-center">{t('bill_col_sr')}</th>
                  <th className="py-2 px-3">{t('bill_col_item')}</th>
                  {isGST && (
                    <>
                      <th className="py-2 px-2 w-24 text-right">{t('bill_col_rate')}</th>
                      <th className="py-2 px-2 w-20 text-right">{t('bill_col_disc')}</th>
                    </>
                  )}
                  <th className="py-2 px-2 w-16 text-center">{t('bill_col_qty')}</th>
                  <th className="py-2 px-3 w-28 text-right">{t('bill_col_amount')}</th>
                  <th className="py-2 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/60 relative">
                    <td className="py-1.5 px-2 text-center font-bold text-slate-600">{index + 1}</td>

                    <td className="py-1.5 px-3">
                      <SearchableCombobox
                        value={item.item_description}
                        onChange={(val) => handleItemDescriptionChange(index, val)}
                        onSelectOption={(opt) => {
                          if (opt.data) selectProduct(index, opt.data);
                        }}
                        options={productOptions}
                        placeholder="Type spare or click ▼ for all..."
                        inputClassName="px-2 py-1 text-xs font-medium"
                      />
                    </td>

                    {isGST && (
                      <>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate || ''}
                            onChange={(e) => handleItemNumericChange(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 border border-slate-300 rounded text-xs font-medium"
                          />
                        </td>
                        <td className="py-1.5 px-2">
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

                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemNumericChange(index, 'qty', parseInt(e.target.value, 10) || 1)}
                        className="w-full text-center px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
                      />
                    </td>

                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">
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

                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
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

          <div className="mt-2">
            <button
              type="button"
              onClick={addItemRow}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('action_add_item')}</span>
            </button>
          </div>

          {/* Front Section: Live Grand Total & Instant Payment / Save Strip */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            {/* Left: Amount Paid & Dues Balance */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">{t('bill_amount_received')}:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    placeholder={`${grandTotal.toFixed(0)}`}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-28 pl-5 pr-2 py-1 text-xs font-bold text-emerald-800 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>

              {/* Status pill */}
              {(() => {
                const paidVal = paidAmount === '' ? grandTotal : parseFloat(paidAmount) || 0;
                const due = Math.max(0, grandTotal - paidVal);
                return due > 0 ? (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    Due: ₹{due.toFixed(2)} (Udhar)
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    ✓ Fully Paid
                  </span>
                );
              })()}
            </div>

            {/* Right: Grand Total & Instant Save & Print Button */}
            <div className="flex items-center gap-3 justify-end">
              {isGST && (
                <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span>Taxable: ₹{totalTaxable.toFixed(2)}</span>
                  <span>GST: ₹{(totalCgst + totalSgst).toFixed(2)}</span>
                </div>
              )}

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Grand Total</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSaveBill(true)}
                className="btn-primary text-xs px-4 py-2 bg-[#0F2942] hover:bg-[#1e3a5f] text-white flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                title="Save and open print preview immediately"
              >
                <Printer className="w-4 h-4" />
                <span className="font-bold">Save &amp; Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Below Section: Extended Details, Physical Pad Replica, Terms & Staff Assignment */}
        <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-200 space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Additional Invoice Details &amp; Pad Preview (Scroll Down)</span>
            <span className="h-px bg-slate-200 flex-1"></span>
          </div>

          {/* Shop Letterhead replica (Physical Pad layout) */}
          <div className="p-3.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-red-600 font-black text-base tracking-tight font-serif">
                <span>★</span>
                <span>{settings.shop_name}</span>
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                {settings.address_line1} {settings.address_line2} • {settings.tagline}
              </div>
            </div>
            <div className="text-left sm:text-right text-xs font-bold text-slate-700">
              <div>Mob: {settings.mobiles}</div>
              {isGST && settings.gstin && <div className="text-red-700 font-mono">GSTIN: {settings.gstin}</div>}
            </div>
          </div>

          {/* Amount in Words */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('bill_rupees_in_words')}</label>
            <div className="p-2.5 bg-white rounded border border-slate-200 text-xs font-semibold italic text-slate-800">
              {wordsAmount}
            </div>
          </div>

          {/* Worker Assignment & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('bill_assigned_worker')}
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
                placeholder="Select technician / staff..."
                inputClassName="text-xs font-medium py-1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('bill_terms_conditions')}
              </label>
              <textarea
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="input-field text-xs font-mono"
              />
            </div>
          </div>

          {/* Secondary Action Bar at bottom */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('action_clear')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveBill(false)}
              className="btn-secondary text-xs px-4 py-1.5 font-semibold text-slate-800"
            >
              <Save className="w-3.5 h-3.5 text-blue-900" />
              <span>{t('action_save')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveBill(true)}
              className="btn-primary text-xs px-5 py-1.5 bg-[#0F2942] hover:bg-[#1e3a5f] text-white"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{t('action_save_print')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced A5 Print, PNG, PDF & WhatsApp Preview Modal */}
      {showPrintModal && previewBill && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-900" />
                <span>Invoice #{previewBill.invoice_num} — Print & Share</span>
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

            {/* WhatsApp Language Selector */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-900" />
                <span>WhatsApp Message Language:</span>
              </span>
              <div className="flex bg-white rounded border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setWaLanguage('mr')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    waLanguage === 'mr'
                      ? 'bg-[#0F2942] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  मराठी
                </button>
                <button
                  type="button"
                  onClick={() => setWaLanguage('hi')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    waLanguage === 'hi'
                      ? 'bg-[#0F2942] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setWaLanguage('en')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    waLanguage === 'en'
                      ? 'bg-[#0F2942] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* 4 Action Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="p-2.5 bg-[#0F2942] hover:bg-[#1e3a5f] text-white rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print (A5 Paper)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-300 shadow-2xs transition-all"
              >
                <ImageIcon className="w-4 h-4 text-blue-900" />
                <span>Download Image</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-300 shadow-2xs transition-all"
              >
                <Download className="w-4 h-4 text-emerald-800" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Bill</span>
              </button>
            </div>

            {/* Bill Print Container */}
            <div
              ref={printRef}
              className="border border-slate-200 rounded-lg p-3 max-h-[55vh] overflow-y-auto bg-slate-100/60"
            >
              <BillPrintTemplate bill={previewBill} settings={settings} />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  resetForm();
                }}
                className="btn-secondary text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editable WhatsApp Dispatch Modal */}
      {waModalData && (
        <WhatsAppModal
          isOpen={waModalData.isOpen}
          onClose={() => setWaModalData(null)}
          recipientName={waModalData.name}
          recipientPhone={waModalData.phone}
          initialMessage={waModalData.message}
          defaultTarget={settings.whatsapp_target || 'desktop'}
          title="Send Invoice Summary via WhatsApp"
        />
      )}
    </div>
  );
};
