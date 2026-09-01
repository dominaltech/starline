import React from 'react';
import { Bill, ShopSettings } from '../../types';
import { formatDate } from '../../utils/formatters';

interface BillPrintTemplateProps {
  bill: Bill;
  settings: ShopSettings;
}

export const BillPrintTemplate: React.FC<BillPrintTemplateProps> = ({ bill, settings }) => {
  const isGST = bill.bill_type === 'GST';
  const minRows = 8;
  const itemsCount = bill.items.length;
  const emptyRowsNeeded = Math.max(0, minRows - itemsCount);

  return (
    <div id="printable-bill" className="bg-white text-black p-6 font-sans max-w-[148mm] mx-auto border border-slate-300 shadow-sm print:border-0 print:shadow-none text-[12px] leading-tight">
      {/* Header matching exact physical bill book */}
      <div className="flex justify-between items-start pb-1">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-red-600 font-extrabold text-lg tracking-tight font-serif">
            <span className="text-xl">★</span>
            <span>{settings.shop_name}</span>
          </div>
        </div>
        <div className="text-right text-[11px] font-bold text-slate-800">
          <div>Mob : {settings.mobiles}</div>
          {isGST && settings.gstin && (
            <div className="text-[10px] text-red-700">GSTIN: {settings.gstin}</div>
          )}
        </div>
      </div>

      <div className="text-[10.5px] text-slate-800 leading-tight">
        <div>{settings.address_line1} {settings.address_line2}</div>
        <div className="italic text-[10px]">{settings.tagline}</div>
      </div>

      <div className="border-t border-b border-black py-1 my-1.5 text-center">
        <h2 className="text-xs font-black tracking-wider uppercase underline">
          {isGST ? 'TAX INVOICE / CUM RECEIPT' : 'INVOICE / CUM RECEIPT'}
        </h2>
      </div>

      {/* Date & Invoice Number */}
      <div className="flex justify-between items-center py-1 font-semibold text-[11px]">
        <div>
          <span>Date : </span>
          <span className="font-bold border-b border-dotted border-black px-2">
            {formatDate(bill.invoice_date)}
          </span>
        </div>
        <div>
          <span>Invoice No. </span>
          <span className="text-red-600 font-bold text-sm border-b border-dotted border-black px-2">
            {bill.invoice_num}
          </span>
        </div>
      </div>

      {/* Customer Information Block */}
      <div className="space-y-1 my-1 text-[11px]">
        <div className="flex items-baseline">
          <span className="shrink-0 font-medium mr-1">Received with thanks from</span>
          <span className="flex-1 border-b border-dotted border-slate-700 font-bold px-1 min-h-[16px]">
            {bill.customer_name}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="shrink-0 font-medium mr-1">Address :</span>
          <span className="flex-1 border-b border-dotted border-slate-700 px-1 min-h-[16px]">
            {bill.customer_address || '-'}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <div className="flex-1 flex items-baseline mr-2">
            <span className="shrink-0 font-medium mr-1">Phone / Mob :</span>
            <span className="flex-1 border-b border-dotted border-slate-700 font-semibold px-1 min-h-[16px]">
              {bill.customer_mobile || '-'}
            </span>
          </div>
          {isGST && bill.customer_gstin && (
            <div className="flex items-baseline">
              <span className="shrink-0 font-medium mr-1">Cust GSTIN:</span>
              <span className="font-mono font-bold border-b border-dotted border-slate-700 px-1">
                {bill.customer_gstin}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Appliance Details Block */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 my-1.5 py-1 border-t border-b border-slate-300 text-[11px]">
        <div className="flex items-baseline">
          <span className="shrink-0 font-medium mr-1">Products Name :</span>
          <span className="flex-1 border-b border-dotted border-slate-700 font-medium px-1">
            {bill.product_name_desc || '-'}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="shrink-0 font-medium mr-1">Brand Model No :</span>
          <span className="flex-1 border-b border-dotted border-slate-700 font-medium px-1">
            {bill.brand_model_no || '-'}
          </span>
        </div>
      </div>

      {/* SPARES REPLACED Table Header */}
      <div className="text-center font-bold text-[11px] uppercase tracking-wider my-0.5">
        SPARES REPLACED
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-black text-[11px]">
        <thead>
          <tr className="border-b border-black text-center font-bold bg-slate-50">
            <th className="border-r border-black w-10 py-1">Sr. No.</th>
            <th className="border-r border-black py-1 text-left px-2">ITEM DESCRIPTION</th>
            {isGST && (
              <>
                <th className="border-r border-black w-14 py-1">RATE</th>
                <th className="border-r border-black w-12 py-1">DISC.</th>
              </>
            )}
            <th className="border-r border-black w-12 py-1">QTY.</th>
            <th className="w-20 py-1 text-right px-2">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, index) => (
            <tr key={item.id || index} className="border-b border-slate-200">
              <td className="border-r border-black text-center py-1">{index + 1}</td>
              <td className="border-r border-black px-2 py-1">
                <div className="font-medium">{item.item_description}</div>
                {isGST && item.hsn_code && (
                  <span className="text-[9px] text-slate-500 font-mono">HSN: {item.hsn_code}</span>
                )}
              </td>
              {isGST && (
                <>
                  <td className="border-r border-black text-center py-1">₹{item.rate}</td>
                  <td className="border-r border-black text-center py-1">{item.discount ? `${item.discount}%` : '-'}</td>
                </>
              )}
              <td className="border-r border-black text-center py-1 font-semibold">{item.qty}</td>
              <td className="px-2 py-1 text-right font-semibold">₹{item.amount.toFixed(2)}</td>
            </tr>
          ))}

          {/* Empty filler rows for physical pad look */}
          {Array.from({ length: emptyRowsNeeded }).map((_, i) => (
            <tr key={`empty-${i}`} className="border-b border-slate-100 min-h-[20px]">
              <td className="border-r border-black py-2">&nbsp;</td>
              <td className="border-r border-black py-2">&nbsp;</td>
              {isGST && (
                <>
                  <td className="border-r border-black py-2">&nbsp;</td>
                  <td className="border-r border-black py-2">&nbsp;</td>
                </>
              )}
              <td className="border-r border-black py-2">&nbsp;</td>
              <td className="py-2">&nbsp;</td>
            </tr>
          ))}

          {/* GST Mode Breakdown Rows */}
          {isGST && (
            <>
              <tr className="border-t border-black text-[10px]">
                <td colSpan={isGST ? 4 : 2} className="border-r border-black text-right px-2 py-0.5 font-medium">
                  Taxable Subtotal:
                </td>
                <td className="px-2 py-0.5 text-right font-medium">₹{bill.taxable_value.toFixed(2)}</td>
              </tr>
              <tr className="text-[10px]">
                <td colSpan={isGST ? 4 : 2} className="border-r border-black text-right px-2 py-0.5 font-medium">
                  CGST (9%):
                </td>
                <td className="px-2 py-0.5 text-right font-medium">₹{bill.cgst_amount.toFixed(2)}</td>
              </tr>
              <tr className="text-[10px]">
                <td colSpan={isGST ? 4 : 2} className="border-r border-black text-right px-2 py-0.5 font-medium">
                  SGST (9%):
                </td>
                <td className="px-2 py-0.5 text-right font-medium">₹{bill.sgst_amount.toFixed(2)}</td>
              </tr>
            </>
          )}

          {/* TOTAL Row */}
          <tr className="border-t-2 border-black font-bold text-[12px] bg-slate-50">
            <td colSpan={isGST ? 4 : 2} className="border-r border-black text-right px-2 py-1 tracking-wider">
              TOTAL
            </td>
            <td className="px-2 py-1 text-right text-black font-black">
              ₹{bill.grand_total.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer Block */}
      <div className="mt-2 space-y-1 text-[10px]">
        <div className="flex items-baseline">
          <span className="font-semibold mr-1 shrink-0">Rupees in Word :</span>
          <span className="flex-1 italic font-medium border-b border-dotted border-slate-700 px-1">
            {bill.words_amount}
          </span>
        </div>

        <div className="pt-1">
          <div className="font-semibold underline">Condition Apply :</div>
          <div className="text-[9.5px] text-slate-700 italic pl-1 leading-normal whitespace-pre-line">
            {bill.condition_apply || settings.default_conditions}
          </div>
        </div>

        {bill.assigned_worker_name && (
          <div className="text-[9.5px] font-semibold text-slate-800 pt-0.5">
            Technician Assigned: {bill.assigned_worker_name}
          </div>
        )}

        {/* Signature lines */}
        <div className="flex justify-between items-end pt-8 pb-2">
          <div className="text-center">
            <div className="border-t border-slate-700 w-36 pt-1 font-semibold text-[10px]">
              Signature of Technician
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-700 w-36 pt-1 font-semibold text-[10px]">
              Customer's Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
