import React, { useState, useRef } from 'react';
import { useDb } from '../../context/DbContext';
import { useLanguage } from '../../context/LanguageContext';
import { Bill } from '../../types';
import { formatDate } from '../../utils/formatters';
import { BillPrintTemplate } from './BillPrintTemplate';
import { JobStatusBadge } from './JobStatusBadge';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Search,
  Printer,
  Ban,
  X,
  FileText,
  Phone,
  Download,
  Image as ImageIcon,
  MessageCircle,
  Globe
} from 'lucide-react';

export const BillHistory: React.FC = () => {
  const { bills, settings, updateBillJobStatus, cancelBill } = useDb();

  const printRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [waLanguage, setWaLanguage] = useState<'mr' | 'hi' | 'en'>('mr');

  // Filter bills
  const filteredBills = bills.filter((b) => {
    if (filterType !== 'ALL' && b.bill_type !== filterType) return false;
    if (filterPayment !== 'ALL' && b.payment_status !== filterPayment) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchInv = b.invoice_num.toLowerCase().includes(q);
      const matchCust = b.customer_name.toLowerCase().includes(q);
      const matchMob = b.customer_mobile.includes(q);
      const matchApp = (b.product_name_desc || '').toLowerCase().includes(q);
      return matchInv || matchCust || matchMob || matchApp;
    }
    return true;
  });

  const handleCancelClick = (bill: Bill) => {
    if (bill.is_cancelled) return;
    const confirm = window.confirm(
      `Are you sure you want to cancel Invoice #${bill.invoice_num}? This will restore product inventory and adjust customer dues.`
    );
    if (confirm) {
      cancelBill(bill.id, 'User requested cancellation');
    }
  };

  // Download PNG Image
  const handleDownloadImage = async () => {
    if (!printRef.current || !selectedBill) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `StarLine_Bill_${selectedBill.invoice_num}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Image export failed:', e);
      alert('Failed to generate image');
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!printRef.current || !selectedBill) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`StarLine_Bill_${selectedBill.invoice_num}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Failed to generate PDF');
    }
  };

  // Build WhatsApp Message
  const buildBillWhatsAppMessage = (bill: Bill, lang: 'mr' | 'hi' | 'en'): string => {
    const itemsList = bill.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.item_description} × ${it.qty} = ₹${it.amount.toFixed(2)}`
      )
      .join('\n');

    if (lang === 'mr') {
      return (
        `*${settings.shop_name}*\n` +
        `दुकान क्र. ३, अन्वर इस्टेट, दक्षिण सदर बाजार, लस्कर, सोलापूर\n` +
        `मोबाईल: ${settings.mobiles}\n\n` +
        `*बिल / पावती तपशील*\n` +
        `बिल क्र.: *#${bill.invoice_num}*\n` +
        `दिनांक: ${formatDate(bill.invoice_date)}\n` +
        `ग्राहक नाव: ${bill.customer_name}\n` +
        (bill.product_name_desc ? `उपकरण: ${bill.product_name_desc} ${bill.brand_model_no || ''}\n` : '') +
        `------------------------\n` +
        `*बदललेले सुटे भाग:*\n` +
        `${itemsList}\n` +
        `------------------------\n` +
        `*एकूण रक्कम (Total): ₹${bill.grand_total.toFixed(2)}*\n` +
        `जमा रक्कम (Paid): ₹${bill.paid_amount.toFixed(2)}\n` +
        (bill.due_amount > 0 ? `*बाकी रक्कम (Dues): ₹${bill.due_amount.toFixed(2)}*\n` : `बाकी: ₹0.00 (पूर्ण भरणा)\n`) +
        `\nस्टार लाईन सर्व्हिसेस निवडल्याबद्दल धन्यवाद!`
      );
    } else if (lang === 'hi') {
      return (
        `*${settings.shop_name}*\n` +
        `दुकान क्र. ३, अनवर एस्टेट, दक्षिण सदर बाजार, लस्कर, सोलापुर\n` +
        `संपर्क: ${settings.mobiles}\n\n` +
        `*बिल / रसीद विवरण*\n` +
        `बिल क्र.: *#${bill.invoice_num}*\n` +
        `दिनांक: ${formatDate(bill.invoice_date)}\n` +
        `ग्राहक का नाम: ${bill.customer_name}\n` +
        (bill.product_name_desc ? `उपकरण: ${bill.product_name_desc} ${bill.brand_model_no || ''}\n` : '') +
        `------------------------\n` +
        `*बदले गए स्पेयर पार्ट्स:*\n` +
        `${itemsList}\n` +
        `------------------------\n` +
        `*कुल राशि (Total): ₹${bill.grand_total.toFixed(2)}*\n` +
        `प्राप्त राशि (Paid): ₹${bill.paid_amount.toFixed(2)}\n` +
        (bill.due_amount > 0 ? `*बकाया राशि (Dues): ₹${bill.due_amount.toFixed(2)}*\n` : `बकाया: ₹0.00 (पूर्ण भुगतान)\n`) +
        `\nस्टार लाइन सर्विसेज में सेवा का अवसर देने के लिए धन्यवाद!`
      );
    } else {
      return (
        `*${settings.shop_name}*\n` +
        `Shop No. 3, Anvar Estate, South Sadar Bazar, Solapur\n` +
        `Contact: ${settings.mobiles}\n\n` +
        `*INVOICE / RECEIPT SUMMARY*\n` +
        `Invoice #: *#${bill.invoice_num}*\n` +
        `Date: ${formatDate(bill.invoice_date)}\n` +
        `Customer: ${bill.customer_name}\n` +
        (bill.product_name_desc ? `Appliance: ${bill.product_name_desc} ${bill.brand_model_no || ''}\n` : '') +
        `------------------------\n` +
        `*Items Replaced:*\n` +
        `${itemsList}\n` +
        `------------------------\n` +
        `*Grand Total: ₹${bill.grand_total.toFixed(2)}*\n` +
        `Amount Paid: ₹${bill.paid_amount.toFixed(2)}\n` +
        (bill.due_amount > 0 ? `*Outstanding Dues: ₹${bill.due_amount.toFixed(2)}*\n` : `Dues: ₹0.00 (Fully Settled)\n`) +
        `\nThank you for choosing Star Line Services!`
      );
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedBill) return;
    const cleanMobile = selectedBill.customer_mobile.replace(/\D/g, '');
    const mobileWithCode = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const msg = encodeURIComponent(buildBillWhatsAppMessage(selectedBill, waLanguage));
    const url = `https://wa.me/${mobileWithCode}?text=${msg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Invoice #, Customer Name, Mobile, Appliance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 text-xs font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-900 bg-white"
            >
              <option value="ALL">All Bills ({bills.length})</option>
              <option value="ESTIMATE">Estimate (Non-GST)</option>
              <option value="GST">GST Tax Invoices</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Payment:</span>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-900 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bill Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="table-header">
              <tr>
                <th className="py-3 px-3">Inv #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer & Mobile</th>
                <th className="py-3 px-3">Appliance</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Total (₹)</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Job Status</th>
                <th className="py-3 px-3 text-center">Technician</th>
                <th className="py-3 px-3 text-right">Print / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                    No billing records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const firstItem = bill.items[0];
                  const currentJobStatus = firstItem ? firstItem.job_status : 'WORK_DONE';

                  return (
                    <tr
                      key={bill.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        bill.is_cancelled ? 'opacity-60 bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold font-mono text-red-600">
                        {bill.invoice_num}
                        {bill.is_cancelled && (
                          <span className="block text-[10px] text-rose-600 font-semibold font-sans">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(bill.invoice_date)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{bill.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{bill.customer_mobile || '-'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-medium">{bill.product_name_desc || '-'}</div>
                        {bill.brand_model_no && (
                          <div className="text-[11px] text-slate-400">{bill.brand_model_no}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            bill.bill_type === 'GST'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {bill.bill_type === 'GST' ? 'GST (18%)' : 'Estimate'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{bill.grand_total.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            bill.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bill.payment_status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {bill.payment_status}
                        </span>
                      </td>

                      {/* Job Status with interactive toggle */}
                      <td className="py-3 px-3 text-center">
                        <JobStatusBadge
                          status={currentJobStatus}
                          editable={!bill.is_cancelled}
                          onChange={(newStatus) => {
                            if (firstItem) {
                              updateBillJobStatus(bill.id, firstItem.id, newStatus);
                            }
                          }}
                        />
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600 font-medium">
                        {bill.assigned_worker_name || '-'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedBill(bill);
                              setShowPrintModal(true);
                            }}
                            className="btn-primary text-[11px] py-1 px-2.5 bg-[#0F2942] hover:bg-[#1e3a5f]"
                            title="Print, Save PDF/Image, WhatsApp"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Bill</span>
                          </button>

                          {!bill.is_cancelled && (
                            <button
                              onClick={() => handleCancelClick(bill)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                              title="Cancel Bill"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Enhanced Print, PDF, Image & WhatsApp Modal */}
      {showPrintModal && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-900" />
                <span>Invoice #{selectedBill.invoice_num} — Print & Share</span>
              </h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector for WhatsApp Message */}
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
              {/* Native Print Trigger */}
              <button
                type="button"
                onClick={() => window.print()}
                className="p-2.5 bg-[#0F2942] hover:bg-[#1e3a5f] text-white rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print (A5 Paper)</span>
              </button>

              {/* Download PNG */}
              <button
                type="button"
                onClick={handleDownloadImage}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-300 shadow-2xs transition-all"
              >
                <ImageIcon className="w-4 h-4 text-blue-900" />
                <span>Download Image</span>
              </button>

              {/* Download PDF */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-300 shadow-2xs transition-all"
              >
                <Download className="w-4 h-4 text-emerald-800" />
                <span>Download PDF</span>
              </button>

              {/* Send WhatsApp */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Bill</span>
              </button>
            </div>

            {/* Bill Preview Box */}
            <div
              ref={printRef}
              className="border border-slate-200 rounded-lg p-3 max-h-[55vh] overflow-y-auto bg-slate-100/60"
            >
              <BillPrintTemplate bill={selectedBill} settings={settings} />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowPrintModal(false)}
                className="btn-secondary text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
