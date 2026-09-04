import * as XLSX from 'xlsx';
import { Bill, CreditNote, ShopSettings, B2BBill } from '../types';

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGstin(gstin?: string): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

export interface GstPeriodFilter {
  year: number;
  month: number; // 1-12 (0 for quarterly/annual)
  periodString: string; // e.g. "062026", "Q12026", "FY2026-27"
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
}

function formatDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function formatDateToDDMMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
}

export function filterDataByPeriod(
  bills: Bill[],
  creditNotes: CreditNote[],
  filter: GstPeriodFilter
): { filteredBills: Bill[]; filteredCreditNotes: CreditNote[] } {
  const filteredBills = bills.filter(b => {
    if (!b.invoice_date) return false;
    return b.invoice_date >= filter.fromDate && b.invoice_date <= filter.toDate;
  });

  const filteredCreditNotes = creditNotes.filter(cn => {
    if (!cn.note_date) return false;
    return cn.note_date >= filter.fromDate && cn.note_date <= filter.toDate;
  });

  return { filteredBills, filteredCreditNotes };
}

/**
 * GENERATE GSTR-1 JSON
 * Matches 27ADEPW8222B1ZL_GSTR1_JUN-2026_09072026_103902.json format byte-for-byte
 */
export function generateGstr1Json(
  bills: Bill[],
  creditNotes: CreditNote[],
  settings: ShopSettings,
  filter: GstPeriodFilter
): string {
  const { filteredBills } = filterDataByPeriod(bills, creditNotes, filter);

  // Only consider GST mode bills for GSTR-1
  const gstBills = filteredBills.filter(b => b.bill_type === 'GST' && !b.is_cancelled);

  // 1. Group B2B bills (Customers with GSTIN)
  const b2bMap: Record<string, Bill[]> = {};
  const b2cRateMap: Record<number, { txval: number; camt: number; samt: number; iamt: number }> = {};
  const hsnB2bMap: Record<string, { txval: number; camt: number; samt: number; iamt: number; qty: number; uqc: string; rt: number }> = {};
  const hsnB2cMap: Record<string, { txval: number; camt: number; samt: number; iamt: number; qty: number; uqc: string; rt: number }> = {};

  gstBills.forEach(bill => {
    const isB2B = Boolean(bill.customer_gstin && bill.customer_gstin.trim().length >= 15);

    if (isB2B && bill.customer_gstin) {
      const ctin = bill.customer_gstin.trim().toUpperCase();
      if (!b2bMap[ctin]) b2bMap[ctin] = [];
      b2bMap[ctin].push(bill);

      // Populate HSN for B2B
      bill.items.forEach(item => {
        const hsn = item.hsn_code || '84159000';
        const rt = item.tax_rate || 18;
        const key = `${hsn}_${rt}`;
        if (!hsnB2bMap[key]) {
          hsnB2bMap[key] = { txval: 0, camt: 0, samt: 0, iamt: 0, qty: 0, uqc: 'NOS', rt };
        }
        hsnB2bMap[key].txval += item.taxable_value || 0;
        hsnB2bMap[key].camt += item.cgst_amount || 0;
        hsnB2bMap[key].samt += item.sgst_amount || 0;
        hsnB2bMap[key].qty += item.qty || 0;
      });
    } else {
      // B2CS aggregation (rate-wise)
      bill.items.forEach(item => {
        const rt = item.tax_rate || 18;
        if (!b2cRateMap[rt]) {
          b2cRateMap[rt] = { txval: 0, camt: 0, samt: 0, iamt: 0 };
        }
        b2cRateMap[rt].txval += item.taxable_value || 0;
        b2cRateMap[rt].camt += item.cgst_amount || 0;
        b2cRateMap[rt].samt += item.sgst_amount || 0;

        // Populate HSN for B2C
        const hsn = item.hsn_code || '84159000';
        const key = `${hsn}_${rt}`;
        if (!hsnB2cMap[key]) {
          hsnB2cMap[key] = { txval: 0, camt: 0, samt: 0, iamt: 0, qty: 0, uqc: 'NOS', rt };
        }
        hsnB2cMap[key].txval += item.taxable_value || 0;
        hsnB2cMap[key].camt += item.cgst_amount || 0;
        hsnB2cMap[key].samt += item.sgst_amount || 0;
        hsnB2cMap[key].qty += item.qty || 0;
      });
    }
  });

  // Build B2B JSON array
  const b2b = Object.entries(b2bMap).map(([ctin, billList]) => {
    return {
      ctin,
      inv: billList.map(bill => {
        const pos = ctin.substring(0, 2) || settings.state_code;
        return {
          inum: bill.invoice_num,
          idt: formatDateToDDMMYYYY(bill.invoice_date),
          val: Math.round(bill.grand_total * 100) / 100,
          pos,
          rchrg: 'N',
          inv_typ: 'R',
          itms: bill.items.map((item, idx) => ({
            num: idx + 1,
            itm_det: {
              txval: Math.round(item.taxable_value * 100) / 100,
              rt: item.tax_rate || 18,
              iamt: 0,
              camt: Math.round(item.cgst_amount * 100) / 100,
              samt: Math.round(item.sgst_amount * 100) / 100,
              csamt: 0
            }
          }))
        };
      })
    };
  });

  // Build B2CS JSON array
  const b2cs = Object.entries(b2cRateMap).map(([rateStr, val]) => ({
    typ: 'OE',
    sply_ty: 'INTRA',
    rt: Number(rateStr),
    pos: settings.state_code,
    txval: Math.round(val.txval * 100) / 100,
    camt: Math.round(val.camt * 100) / 100,
    samt: Math.round(val.samt * 100) / 100,
    csamt: 0
  }));

  // Build HSN B2B & B2C
  const hsn_b2b = Object.entries(hsnB2bMap).map(([key, val], idx) => {
    const [hsn_sc] = key.split('_');
    return {
      num: idx + 1,
      hsn_sc,
      txval: Math.round(val.txval * 100) / 100,
      iamt: 0,
      camt: Math.round(val.camt * 100) / 100,
      samt: Math.round(val.samt * 100) / 100,
      csamt: 0,
      desc: '',
      user_desc: '',
      uqc: val.uqc,
      qty: val.qty,
      rt: val.rt
    };
  });

  const hsn_b2c = Object.entries(hsnB2cMap).map(([key, val], idx) => {
    const [hsn_sc] = key.split('_');
    return {
      num: idx + 1,
      hsn_sc,
      txval: Math.round(val.txval * 100) / 100,
      iamt: 0,
      camt: Math.round(val.camt * 100) / 100,
      samt: Math.round(val.samt * 100) / 100,
      csamt: 0,
      desc: '',
      user_desc: '',
      uqc: val.uqc,
      qty: val.qty,
      rt: val.rt
    };
  });

  // Document Issue summary
  const invoiceNums = gstBills.map(b => parseInt(b.invoice_num.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
  const minInv = invoiceNums.length > 0 ? String(Math.min(...invoiceNums)) : '1';
  const maxInv = invoiceNums.length > 0 ? String(Math.max(...invoiceNums)) : '1';
  const cancelledCount = filteredBills.filter(b => b.is_cancelled).length;

  const doc_issue = {
    doc_det: [
      {
        doc_num: 1,
        docs: [
          {
            num: 1,
            from: minInv,
            to: maxInv,
            totnum: gstBills.length + cancelledCount,
            cancel: cancelledCount,
            net_issue: gstBills.length
          }
        ]
      }
    ]
  };

  const gstr1Obj = {
    gstin: settings.gstin || '27ADEPW8222B1ZL',
    fp: filter.periodString,
    b2b,
    b2cs,
    hsn: {
      hsn_b2b,
      hsn_b2c
    },
    doc_issue
  };

  return JSON.stringify(gstr1Obj, null, 2);
}

/**
 * GENERATE GSTR-3B JSON
 * Matches 27ADEPW8222B1ZL_GSTR3B_JUN-2026_09072026_104016.json format byte-for-byte
 */
export function generateGstr3bJson(
  bills: Bill[],
  settings: ShopSettings,
  filter: GstPeriodFilter
): string {
  const { filteredBills } = filterDataByPeriod(bills, [], filter);
  const gstBills = filteredBills.filter(b => b.bill_type === 'GST' && !b.is_cancelled);

  let totalTxval = 0;
  let totalCamt = 0;
  let totalSamt = 0;

  gstBills.forEach(b => {
    totalTxval += b.taxable_value || 0;
    totalCamt += b.cgst_amount || 0;
    totalSamt += b.sgst_amount || 0;
  });

  const gstr3bObj = {
    gstin: settings.gstin || '27ADEPW8222B1ZL',
    ret_period: filter.periodString,
    sup_details: {
      osup_det: {
        txval: Math.round(totalTxval * 100) / 100,
        iamt: 0,
        camt: Math.round(totalCamt * 100) / 100,
        samt: Math.round(totalSamt * 100) / 100,
        csamt: 0
      },
      osup_zero: { txval: 0, iamt: 0, csamt: 0 },
      osup_nil_exmp: { txval: 0 },
      isup_rev: { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 },
      osup_nongst: { txval: 0 }
    },
    inter_sup: { comp_details: [], uin_details: [], unreg_details: [] },
    itc_elg: {
      itc_avl: [
        { camt: 0, samt: 0, csamt: 0, iamt: 0, ty: 'OTH' },
        { camt: 0, samt: 0, csamt: 0, iamt: 0, ty: 'IMPG' },
        { camt: 0, samt: 0, csamt: 0, iamt: 0, ty: 'IMPS' },
        { camt: 0, samt: 0, csamt: 0, iamt: 0, ty: 'ISRC' },
        { camt: 0, samt: 0, csamt: 0, iamt: 0, ty: 'ISD' }
      ],
      itc_rev: [
        { camt: 0, csamt: 0, iamt: 0, samt: 0, ty: 'RUL' },
        { camt: 0, csamt: 0, iamt: 0, samt: 0, ty: 'OTH' }
      ],
      itc_net: { camt: 0, csamt: 0, iamt: 0, samt: 0 },
      itc_inelg: [
        { camt: 0, csamt: 0, iamt: 0, samt: 0, ty: 'RUL' },
        { camt: 0, csamt: 0, iamt: 0, samt: 0, ty: 'OTH' }
      ]
    },
    inward_sup: {
      isup_details: [
        { inter: 0, intra: 0, ty: 'GST' },
        { inter: 0, intra: 0, ty: 'NONGST' }
      ]
    },
    intr_ltfee: { intr_details: { camt: 0, csamt: 0, iamt: 0, samt: 0 } }
  };

  return JSON.stringify(gstr3bObj, null, 2);
}

/**
 * GENERATE GSTR-1 EXCEL (.xlsx)
 * Matches official 27ABBPI4866Q1Z1_GSTR1_2026-07.xlsx sheet names and column order
 */
export function generateGstr1Excel(
  bills: Bill[],
  creditNotes: CreditNote[],
  settings: ShopSettings,
  filter: GstPeriodFilter
): Uint8Array {
  const { filteredBills, filteredCreditNotes } = filterDataByPeriod(bills, creditNotes, filter);
  const gstBills = filteredBills.filter(b => b.bill_type === 'GST' && !b.is_cancelled);

  const wb = XLSX.utils.book_new();

  // 1. Sheet: b2b,sez,de
  const b2bRows: (string | number)[][] = [
    ['Summary For B2B,SEZ,DE(4A,4B,6B,6C)'],
    ['No. of Recipients', '', 'No. of Invoices', '', 'Total Invoice Value', '', '', '', '', '', '', 'Total Taxable Value', 'Total Cess'],
    [],
    [
      'GSTIN/UIN of Recipient',
      'Receiver Name',
      'Invoice Number',
      'Invoice date',
      'Invoice Value',
      'Place Of Supply',
      'Reverse Charge',
      'Applicable % of Tax Rate',
      'Invoice Type',
      'E-Commerce GSTIN',
      'Rate',
      'Taxable Value',
      'Cess Amount'
    ]
  ];

  let b2bRecipientsCount = 0;
  const seenCtin = new Set<string>();

  gstBills.forEach(bill => {
    if (bill.customer_gstin && bill.customer_gstin.trim().length >= 15) {
      const ctin = bill.customer_gstin.trim().toUpperCase();
      if (!seenCtin.has(ctin)) {
        seenCtin.add(ctin);
        b2bRecipientsCount++;
      }
      bill.items.forEach(item => {
        b2bRows.push([
          ctin,
          bill.customer_name,
          bill.invoice_num,
          formatDateToDDMMMYYYY(bill.invoice_date),
          bill.grand_total,
          `${settings.state_code}-${settings.state_name}`,
          'N',
          '',
          'Regular B2B',
          '',
          item.tax_rate || 18,
          Math.round(item.taxable_value * 100) / 100,
          0
        ]);
      });
    }
  });
  b2bRows[2] = [b2bRecipientsCount, '', seenCtin.size, '', '', '', '', '', '', '', '', '', ''];

  const wsB2B = XLSX.utils.aoa_to_sheet(b2bRows);
  XLSX.utils.book_append_sheet(wb, wsB2B, 'b2b,sez,de');

  // 2. Sheet: b2cs
  const b2csRows: (string | number)[][] = [
    ['Summary For B2CS(7)'],
    ['', '', '', '', 'Total Taxable Value', 'Total Cess', ''],
    [],
    ['Type', 'Place Of Supply', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount', 'E-Commerce GSTIN']
  ];

  const b2cRateMap: Record<number, number> = {};
  gstBills.forEach(bill => {
    if (!bill.customer_gstin || bill.customer_gstin.trim().length < 15) {
      bill.items.forEach(item => {
        const rt = item.tax_rate || 18;
        b2cRateMap[rt] = (b2cRateMap[rt] || 0) + (item.taxable_value || 0);
      });
    }
  });

  Object.entries(b2cRateMap).forEach(([rt, txval]) => {
    b2csRows.push([
      'OE',
      `${settings.state_code}-${settings.state_name}`,
      '',
      Number(rt),
      Math.round(txval * 100) / 100,
      0,
      ''
    ]);
  });
  const wsB2CS = XLSX.utils.aoa_to_sheet(b2csRows);
  XLSX.utils.book_append_sheet(wb, wsB2CS, 'b2cs');

  // 3. Sheet: cdnr
  const cdnrRows: (string | number)[][] = [
    ['Summary For CDNR(9B)'],
    ['No. of Recipient', '', 'No. of Notes', '', '', '', '', '', 'Total Note Value', '', '', 'Total Taxable Value', 'Total Cess'],
    [],
    [
      'GSTIN/UIN of Recipient',
      'Receiver Name',
      'Note Number',
      'Note Date',
      'Note Type',
      'Place Of Supply',
      'Reverse Charge',
      'Note Supply Type',
      'Note Value',
      'Applicable % of Tax Rate',
      'Rate',
      'Taxable Value',
      'Cess Amount'
    ]
  ];

  filteredCreditNotes.forEach(cn => {
    if (cn.customer_gstin && cn.customer_gstin.trim().length >= 15) {
      cdnrRows.push([
        cn.customer_gstin.trim().toUpperCase(),
        cn.customer_name,
        cn.note_num,
        formatDateToDDMMMYYYY(cn.note_date),
        cn.note_type || 'C',
        `${settings.state_code}-${settings.state_name}`,
        'N',
        'Regular B2B',
        cn.total_value,
        '',
        cn.tax_rate || 18,
        Math.round(cn.taxable_value * 100) / 100,
        0
      ]);
    }
  });
  const wsCDNR = XLSX.utils.aoa_to_sheet(cdnrRows);
  XLSX.utils.book_append_sheet(wb, wsCDNR, 'cdnr');

  // 4. Sheet: hsn(b2b)
  const hsnB2bRows: (string | number)[][] = [
    ['Summary For HSN(12)'],
    ['No. of HSN', '', '', '', 'Total Value', '', 'Total Taxable Value', 'Total Integrated Tax', 'Total Central Tax', 'Total State/UT Tax', 'Total Cess'],
    [],
    ['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Rate', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount']
  ];

  const hsnB2bMap: Record<string, { txval: number; camt: number; samt: number; qty: number; rt: number }> = {};
  gstBills.forEach(bill => {
    if (bill.customer_gstin && bill.customer_gstin.trim().length >= 15) {
      bill.items.forEach(item => {
        const hsn = item.hsn_code || '84159000';
        const rt = item.tax_rate || 18;
        const key = `${hsn}_${rt}`;
        if (!hsnB2bMap[key]) hsnB2bMap[key] = { txval: 0, camt: 0, samt: 0, qty: 0, rt };
        hsnB2bMap[key].txval += item.taxable_value;
        hsnB2bMap[key].camt += item.cgst_amount;
        hsnB2bMap[key].samt += item.sgst_amount;
        hsnB2bMap[key].qty += item.qty;
      });
    }
  });

  Object.entries(hsnB2bMap).forEach(([key, val]) => {
    const [hsn] = key.split('_');
    const totVal = val.txval + val.camt + val.samt;
    hsnB2bRows.push([
      hsn,
      hsn,
      'NOS-NUMBERS',
      val.qty,
      Math.round(totVal * 100) / 100,
      val.rt,
      Math.round(val.txval * 100) / 100,
      0,
      Math.round(val.camt * 100) / 100,
      Math.round(val.samt * 100) / 100,
      0
    ]);
  });
  const wsHsnB2B = XLSX.utils.aoa_to_sheet(hsnB2bRows);
  XLSX.utils.book_append_sheet(wb, wsHsnB2B, 'hsn(b2b)');

  // 5. Sheet: hsn(b2c)
  const hsnB2cRows: (string | number)[][] = [
    ['Summary For HSN(12)'],
    ['No. of HSN', '', '', '', 'Total Value', '', 'Total Taxable Value', 'Total Integrated Tax', 'Total Central Tax', 'Total State/UT Tax', 'Total Cess'],
    [],
    ['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Rate', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount']
  ];

  const hsnB2cMap: Record<string, { txval: number; camt: number; samt: number; qty: number; rt: number }> = {};
  gstBills.forEach(bill => {
    if (!bill.customer_gstin || bill.customer_gstin.trim().length < 15) {
      bill.items.forEach(item => {
        const hsn = item.hsn_code || '84159000';
        const rt = item.tax_rate || 18;
        const key = `${hsn}_${rt}`;
        if (!hsnB2cMap[key]) hsnB2cMap[key] = { txval: 0, camt: 0, samt: 0, qty: 0, rt };
        hsnB2cMap[key].txval += item.taxable_value;
        hsnB2cMap[key].camt += item.cgst_amount;
        hsnB2cMap[key].samt += item.sgst_amount;
        hsnB2cMap[key].qty += item.qty;
      });
    }
  });

  Object.entries(hsnB2cMap).forEach(([key, val]) => {
    const [hsn] = key.split('_');
    const totVal = val.txval + val.camt + val.samt;
    hsnB2cRows.push([
      hsn,
      hsn,
      'NOS-NUMBERS',
      val.qty,
      Math.round(totVal * 100) / 100,
      val.rt,
      Math.round(val.txval * 100) / 100,
      0,
      Math.round(val.camt * 100) / 100,
      Math.round(val.samt * 100) / 100,
      0
    ]);
  });
  const wsHsnB2C = XLSX.utils.aoa_to_sheet(hsnB2cRows);
  XLSX.utils.book_append_sheet(wb, wsHsnB2C, 'hsn(b2c)');

  // 6. Sheet: docs
  const invoiceNums = gstBills.map(b => parseInt(b.invoice_num.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
  const minInv = invoiceNums.length > 0 ? String(Math.min(...invoiceNums)) : '1';
  const maxInv = invoiceNums.length > 0 ? String(Math.max(...invoiceNums)) : '1';
  const cancelledCount = filteredBills.filter(b => b.is_cancelled).length;

  const docsRows: (string | number)[][] = [
    ['Summary of documents issued during the tax period(13)'],
    ['', '', '', 'Total Number', 'Total Cancelled'],
    [],
    ['Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled'],
    ['Invoices for outward supply', minInv, maxInv, gstBills.length + cancelledCount, cancelledCount],
    ['Credit Note', filteredCreditNotes.length > 0 ? filteredCreditNotes[filteredCreditNotes.length - 1].note_num : '1', filteredCreditNotes.length > 0 ? filteredCreditNotes[0].note_num : '1', filteredCreditNotes.length, 0]
  ];
  const wsDocs = XLSX.utils.aoa_to_sheet(docsRows);
  XLSX.utils.book_append_sheet(wb, wsDocs, 'docs');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * GENERATE GSTR-3B EXCEL (.xlsx)
 * Matches 3B.xlsx layout
 */
export function generateGstr3bExcel(
  bills: Bill[],
  settings: ShopSettings,
  filter: GstPeriodFilter
): Uint8Array {
  const { filteredBills } = filterDataByPeriod(bills, [], filter);
  const gstBills = filteredBills.filter(b => b.bill_type === 'GST' && !b.is_cancelled);

  let totalTxval = 0;
  let totalCamt = 0;
  let totalSamt = 0;

  gstBills.forEach(b => {
    totalTxval += b.taxable_value || 0;
    totalCamt += b.cgst_amount || 0;
    totalSamt += b.sgst_amount || 0;
  });

  const wb = XLSX.utils.book_new();
  const rows: (string | number)[][] = [
    [settings.shop_name],
    [`${settings.address_line1} ${settings.address_line2}`],
    [`Mobile : ${settings.mobiles}`],
    [],
    [`GSTIN No.: ${settings.gstin}`],
    ['GSTR 3B as per Book'],
    [`From Date  ${formatDateToDDMMYYYY(filter.fromDate)}  To  ${formatDateToDDMMYYYY(filter.toDate)}`],
    ['GSTR 3B Grouping', '', 'Taxable Amount', 'Integrated Tax', 'Central Tax', 'State/UT Tax'],
    ['3.1 Detail of Outward Supplies and Inward supplies'],
    [' liable to reverse charges'],
    ['(a) Outward taxable supplies (other than zero rated, nil rated and exempted)', '', Math.round(totalTxval * 100) / 100, 0, Math.round(totalCamt * 100) / 100, Math.round(totalSamt * 100) / 100],
    ['(b) Outward taxable supplies (zero rated)', '', 0, 0, 0, 0],
    ['(c) Other outward supplies (Nil rated, exempted)', '', 0, 0, 0, 0],
    ['(d) Inward supplies (liable to reverse charge)', '', 0, 0, 0, 0],
    ['(e) Non GST outward supplies', '', 0, 0, 0, 0],
    ['Total', '', Math.round(totalTxval * 100) / 100, 0, Math.round(totalCamt * 100) / 100, Math.round(totalSamt * 100) / 100],
    [],
    ['4. Eligible ITC'],
    ['(A) ITC Available (whether in full or part)'],
    ['  (1) Import of goods', '', 0, 0, 0, 0],
    ['  (2) Import of services', '', 0, 0, 0, 0],
    ['  (3) Inward supplies liable to reverse charge', '', 0, 0, 0, 0],
    ['  (4) Inward supplies from ISD', '', 0, 0, 0, 0],
    ['  (5) All other ITC', '', 0, 0, 0, 0],
    ['(C) Net ITC Available', '', 0, 0, 0, 0]
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * GENERATE MASTER SALES DAYBOOK EXCEL (Tally & CA Audit Format)
 * Flat structured register listing every outward transaction (GST, Estimate & B2B Mechanic)
 */
export function generateMasterSalesDaybookExcel(
  bills: Bill[],
  b2bBills: B2BBill[],
  settings: ShopSettings,
  fromDate: string,
  toDate: string
): Uint8Array {
  const wb = XLSX.utils.book_new();

  const periodRetail = bills.filter(
    b => b.invoice_date >= fromDate && b.invoice_date <= toDate && !b.is_cancelled
  );
  const periodB2B = b2bBills.filter(
    b => b.bill_date >= fromDate && b.bill_date <= toDate
  );

  const rows: (string | number)[][] = [
    [`MASTER SALES DAYBOOK / REGISTER — ${settings.shop_name}`],
    [`Period: ${formatDateToDDMMMYYYY(fromDate)} to ${formatDateToDDMMMYYYY(toDate)} | GSTIN: ${settings.gstin}`],
    [],
    [
      'Date',
      'Voucher Type',
      'Invoice / Bill #',
      'Customer / Mechanic Name',
      'Mobile',
      'GSTIN',
      'State Code',
      'Taxable Value (₹)',
      'CGST (₹)',
      'SGST (₹)',
      'Total Tax (₹)',
      'Invoice Total (₹)',
      'Payment Mode',
      'Paid Amount (₹)',
      'Due / Udhar (₹)',
      'Items Summary'
    ]
  ];

  let sumTaxable = 0;
  let sumCgst = 0;
  let sumSgst = 0;
  let sumTotal = 0;
  let sumPaid = 0;
  let sumDue = 0;

  // 1. Retail Invoices (GST & Estimates)
  periodRetail.forEach(b => {
    const isGst = b.bill_type === 'GST';
    const txval = Math.round((b.taxable_value || 0) * 100) / 100;
    const cgst = Math.round((b.cgst_amount || 0) * 100) / 100;
    const sgst = Math.round((b.sgst_amount || 0) * 100) / 100;
    const totTax = Math.round((cgst + sgst) * 100) / 100;
    const itemsSummary = b.items.map(it => `${it.item_description} (${it.qty}x)`).join(', ');

    sumTaxable += txval;
    sumCgst += cgst;
    sumSgst += sgst;
    sumTotal += b.grand_total;
    sumPaid += b.grand_total;

    rows.push([
      formatDateToDDMMMYYYY(b.invoice_date),
      isGst ? 'GST Tax Invoice' : 'Retail Estimate',
      b.invoice_num,
      b.customer_name,
      b.customer_mobile || '',
      b.customer_gstin || '',
      (b.customer_gstin && b.customer_gstin.length >= 2 ? b.customer_gstin.substring(0, 2) : settings.state_code),
      txval,
      cgst,
      sgst,
      totTax,
      b.grand_total,
      b.payment_mode || 'Cash',
      b.grand_total,
      0,
      itemsSummary
    ]);
  });

  // 2. B2B Mechanic Trade Bills
  periodB2B.forEach(b => {
    const itemsSummary = b.items.map(it => `${it.product_name} (${it.qty}x)`).join(', ');
    const paid = b.paid_amount !== undefined ? b.paid_amount : b.total_amount;
    const due = b.due_amount !== undefined ? b.due_amount : 0;

    sumTaxable += b.total_amount;
    sumTotal += b.total_amount;
    sumPaid += paid;
    sumDue += due;

    rows.push([
      formatDateToDDMMMYYYY(b.bill_date),
      'B2B Mechanic Bill',
      b.invoice_num,
      b.mechanic_name || b.customer_name || 'Mechanic',
      b.mechanic_phone || b.customer_mobile || '',
      '',
      settings.state_code,
      b.total_amount,
      0,
      0,
      0,
      b.total_amount,
      b.payment_method || 'Cash',
      paid,
      due,
      itemsSummary
    ]);
  });

  // Grand Total row
  rows.push([]);
  rows.push([
    'TOTAL',
    '',
    `${periodRetail.length + periodB2B.length} Transactions`,
    '',
    '',
    '',
    '',
    Math.round(sumTaxable * 100) / 100,
    Math.round(sumCgst * 100) / 100,
    Math.round(sumSgst * 100) / 100,
    Math.round((sumCgst + sumSgst) * 100) / 100,
    Math.round(sumTotal * 100) / 100,
    '',
    Math.round(sumPaid * 100) / 100,
    Math.round(sumDue * 100) / 100,
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Register');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
