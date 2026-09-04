# Starline CRM — Complete Master Features Specification (100+ Features)

Comprehensive documentation of all features, capabilities, business logic, statutory compliance engines, and technical workflows built into **Starline CRM** (Appliance Spares, HVAC/Refrigeration & B2B Billing System).

---

## Table of Contents
1. [Retail Billing & Point of Sale (POS)](#1-retail-billing--point-of-sale-pos)
2. [B2B Daily Mechanic Billing](#2-b2b-daily-mechanic-billing)
3. [Split Payments & Multi-Channel Settlement](#3-split-payments--multi-channel-settlement)
4. [Returns (Stock Returns & Credit Notes)](#4-returns-stock-returns--credit-notes)
5. [Udhar Khata (Customer & Mechanic Dues Ledger)](#5-udhar-khata-customer--mechanic-dues-ledger)
6. [Annual Maintenance Contracts (AMC)](#6-annual-maintenance-contracts-amc)
7. [Visual Notes & Supplier Purchase Orders](#7-visual-notes--supplier-purchase-orders)
8. [Inventory, Catalog & Physical Racks](#8-inventory-catalog--physical-racks)
9. [GST Portal Filing & CA Export Hub](#9-gst-portal-filing--ca-export-hub)
10. [Financial Reports & Business Analytics](#10-financial-reports--business-analytics)
11. [Role-Based Access Control & Security](#11-role-based-access-control--security)
12. [i18n Trilingual Engine (English, Marathi, Hindi)](#12-i18n-trilingual-engine-english-marathi-hindi)
13. [Core Performance & Storage Architecture](#13-core-performance--storage-architecture)

---

## 1. Retail Billing & Point of Sale (POS)
1. **Dual Billing Mode Toggle**: 1-click instant switcher between **Estimate (Non-GST)** and **GST Tax Invoice** without clearing item rows.
2. **Statutory 18% GST Engine**: Automatic calculation of 9% CGST and 9% SGST on intra-state spares and appliance service.
3. **Number-to-Words Conversion**: Real-time conversion of invoice grand total into Indian currency words (e.g. *"One Thousand One Hundred Eighty Rupees Only"*).
4. **Searchable Customer Combobox**: Search existing customers by name or mobile number with automatic form pre-fill (Address, GSTIN, Mobile).
5. **Walk-in Customer Registration**: Type customer name and mobile directly into the invoice header; automatically saves new walk-ins into the CRM registry.
6. **Smart Item Autocomplete**: Instant search by spare part name, appliance type, SKU, or HSN code from the live catalog.
7. **Line Item Quantity & Unit Pricing**: Dynamically configure item rate, quantity, and discount per row with instantaneous subtotal recalculation.
8. **Item-Level Job Status Tracking**: Assign operational statuses per item row (`Work Done`, `In Progress`, `Cancelled`).
9. **Technician / Staff Assignment**: Assign specific service workers/technicians to an invoice for commission and performance reporting.
10. **Thermal 3-Inch POS Receipt Printing**: Compact thermal print format optimized for 80mm POS receipt printers.
11. **A4 Tax Invoice Layout**: Full-page official GST Tax Invoice formatted with shop header, GSTIN, bank details, terms & conditions, and authorized signatory.
12. **Configurable Starting Invoice Counter**: Store manager can set starting invoice number (e.g., #981) in Settings; subsequent invoices increment sequentially.
13. **Customer Udhar Protection Rule**: Retail customer invoices strictly enforce full payment; credit/dues are reserved for verified workshop mechanics.
14. **Direct WhatsApp Invoice Sharing**: 1-click sharing of generated bill details to the customer's WhatsApp with a pre-formatted message.
15. **Bill History & Audit Trail**: Chronological list of all generated bills with real-time search by customer, bill number, date range, or bill type.
16. **Duplicate Bill Reprinting**: Instant re-printing of historical slips without altering timestamps or sequence numbers.
17. **Bill Cancellation with Stock Restoration**: Cancelling an invoice marks it as cancelled in the audit log and reverses inventory stock.
18. **Appliance Model & Brand Tracker**: Dedicated input fields for Appliance Name (e.g., Refrigerator, Split AC) and Model Number (e.g., LG 190L Direct Cool).

---

## 2. B2B Daily Mechanic Billing
19. **High-Speed Counter Billing**: Fast keyboard-friendly interface designed for rapid morning and evening mechanic rush hours.
20. **Mechanic Workshop Selector**: Combobox displaying mechanic workshop name, contact number, and current live outstanding dues balance.
21. **Quick-Add Mechanic Modal**: Add new HVAC/fridge mechanics inline without exiting the current billing session.
22. **Catalog Dropdown with Live Stock & Pricing**: Immediate view of available spare parts, physical rack locations, and trade pricing.
23. **Instant Stock Deduction**: Every generated B2B bill deducts spare parts from master inventory in real time.
24. **Multi-Mode B2B Payment**: Supports Cash, Online (UPI/Bank), Udhar (Full Credit), and Split payments.
25. **Automatic Udhar Balance Accumulation**: Unpaid/partial bill balances automatically increment the mechanic's ledger in Udhar Khata.
26. **Sequential `B2B-XXX` Numbering**: Independent invoice series with zero-padded sequencing (e.g. `B2B-001`, `B2B-002`).
27. **Bulk Photo Import**: Select multiple part photos from disk to auto-generate draft catalog items named after the image filenames.
28. **B2B Billing History**: Filterable history table listing mechanic bills by date with status badges and paid/due breakdowns.
29. **B2B Bill Deletion & Restoral**: Deleting a draft or invalid B2B bill automatically returns deducted items back into inventory stock.
30. **Mechanic WhatsApp Slips**: 1-click WhatsApp button to send itemized parts breakdown and balance summary to the mechanic.

---

## 3. Split Payments & Multi-Channel Settlement
31. **4-Channel Retail Split**: Divide invoice totals across Cash, Online 1 (UPI), Online 2 (Card), and Online 3 (Bank Transfer).
32. **5-Channel B2B Mechanic Split**: Includes Cash, Online 1, Online 2, Online 3, plus Udhar (Credit) for workshop mechanics.
33. **Real-Time Split Sum Validation**: Color-coded indicator displaying:
    - `✓ Matched (100%)` in green when inputs equal the grand total.
    - `Remaining: ₹...` in amber when underpaid.
    - `Exceeded: ₹...` in rose when amounts exceed total.
34. **Overpayment & Underpayment Guards**: Blocks invoice generation until the split sum exactly matches the payable total.
35. **Split Payment Audit Records**: Saved invoices persist breakdown objects for accurate end-of-day cash and UPI reconciliation.

---

## 4. Returns (Stock Returns & Credit Notes)
36. **Dedicated "Returns" Navigation**: Renamed from Credit Notes to intuitive "Returns" across the sidebar and headers.
37. **Invoice Linking**: Issue returns against historical Retail Invoices or B2B Mechanic Bills with original invoice number reference.
38. **Automatic Inventory Stock Restoral**: Returning a defective or excess spare part increments warehouse inventory automatically.
39. **Customer Dues Deduction**: If the customer/mechanic had an outstanding balance, the return amount is automatically deducted from dues.
40. **Statutory GST Credit Note (CDNR)**: Generates credit note records mapped directly to GSTR-1 Section 9B for CA tax adjustment.
41. **Return Voucher Printing**: Printable Credit Note / Return voucher with reason for return and restored item breakdown.
42. **Total Credit Value Metric**: Summary metric tracking total rupee value of returns processed in the current period.

---

## 5. Udhar Khata (Customer & Mechanic Dues Ledger)
43. **Unified Dues Ledger**: Consolidates all credit extended to mechanics and customers into a single, searchable ledger.
44. **Dual Tab Segmentation**:
    - **Active Accounts**: Accounts with outstanding dues (`> ₹0`).
    - **Settled Accounts**: Accounts cleared to zero balance (`₹0`).
45. **Vasuli (Collection) Receipt Entry**: Record cash, UPI, or cheque payments against outstanding balances.
46. **Partial & Full Settlement Support**: Real-time balance recalculation with instant status update to "Settled" upon final payment.
47. **Overpayment Guard**: Alerts and blocks entering collection amounts greater than the outstanding debt.
48. **Follow-Up Date Scheduler**: Set expected payment dates for credit accounts.
49. **Overdue Reminder Highlighting**: Color-coded red badges for accounts that have passed their follow-up date.
50. **WhatsApp Payment Reminder Generator**: 1-click WhatsApp message generator with customer name, outstanding balance, and shop UPI details in English, Marathi, or Hindi.
51. **Printable Account Statement**: Full ledger statement showing chronological debit (bills) and credit (vasuli) transactions.

---

## 6. Annual Maintenance Contracts (AMC)
52. **Appliance Maintenance Tracking**: Monitor service contracts for ACs, refrigerators, washing machines, and commercial deep freezers.
53. **Duration Presets**: Quick creation for 1-Year, 6-Month, 3-Month, or Custom date ranges.
54. **Auto-Calculated Expiry Dates**: System automatically determines the contract conclusion date based on start date and tenure.
55. **Contract Status Indicators**:
    - **Active**: Contracts with `> 30` days remaining (green badge).
    - **Expiring Soon**: Contracts with `≤ 30` days remaining (pulsing amber badge).
    - **Expired**: Contracts past their end date (gray/rose badge).
56. **Summary Dashboard Cards**: Real-time metrics counting Total, Active, Expiring, and Expired contracts.
57. **1-Click WhatsApp Renewal Alerts**: Direct reminder sent to customer's phone with appliance details and contract number.
58. **Seamless Contract Renewal**: 1-click renewal marks previous contract as "Renewed" and initiates next cycle from the expiry date.
59. **Printable AMC Certificate**: Formal maintenance contract document with customer, appliance, and terms breakdown.

---

## 7. Visual Notes & Supplier Purchase Orders
60. **Workshop Scratchpad**: Quick digital memo pad for customer requests, technician instructions, and pending orders.
61. **Low Stock Purchase Order Auto-Fill**: Clicking the TopBar low stock alert automatically formats a structured supplier Purchase Order in Notes.
62. **WhatsApp Supplier Forwarding**: Formatted purchase order ready to forward to wholesale spare distributors via WhatsApp.
63. **Photo Attachment Upload**: Attach photos of damaged parts, vendor visiting cards, or hand-written slips via file upload or webcam snapshot.
64. **Catalog Item Linking**: Link notes directly to specific inventory products for fast navigation.
65. **Fullscreen Image Viewer**: High-resolution modal viewer for attached part photos and wiring schematics.

---

## 8. Inventory, Catalog & Physical Racks
66. **Master Parts Catalog**: Full catalog supporting SKU, HSN codes, product type/category, stock quantity, and selling price.
67. **Confidential Buy Price**: Super Admin-protected purchase cost field hidden from ordinary staff for trade privacy.
68. **Custom Minimum Stock Alerts**: Configurable low-stock threshold per product (defaults to 5 units).
69. **Persistent TopBar Low Stock Alert**: Prominent, pulsing alert badge in the top navigation showing the live count of items needing reorder; stays visible until clicked.
70. **Inline Fast Price Editing**: Update retail selling prices directly from the inventory table without opening full edit modals.
71. **Physical Rack & Shelf Organizer**: Visual map of store sections (Rack A1, Shelf 2, Bin 4) for rapid part retrieval by technicians.
72. **Stock Movement Audit Log**: Immutable record of all stock adjustments (Purchase, Retail Sale, B2B Sale, Return, Physical Audit).
73. **Stock Combiner Utility**: Merge duplicate or legacy product records into a single master SKU while consolidating physical quantities.

---

## 9. GST Portal Filing & CA Export Hub
74. **Government Offline Utility JSON Export**: Byte-for-byte compatible JSON export for direct upload into the GST Portal.
75. **Multi-Sheet GSTR-1 Excel Workbook**: Official format including B2B, B2CS, HSN, and Documents Issued sheets.
76. **GSTR-3B Summary JSON & Excel**: Automated monthly tax summary for Table 3.1 outward supplies and Table 4 input tax review.
77. **B2B Table (4A/4B/6B/6C)**: Groups buyer invoices with statutory GSTINs and rate-wise breakdowns.
78. **B2CS Table (7)**: Aggregates intra-state consumer retail sales rate-wise for Maharashtra (State Code 27).
79. **HSN Summary Table (12)**: Aggregates total turnover, quantity, UQC (`NOS`), and tax amounts by HSN code.
80. **Documents Issued Table (13)**: Tracks starting invoice, ending invoice, total issues, cancelled count, and net count.
81. **Quarterly Filter Toggle (QRMP Scheme)**: Supports quarterly filing (Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar) for small businesses.
82. **Full Financial Year (FY) 1-Click Export**: 12-month export (01-Apr to 31-Mar) for annual GSTR-9 returns and Income Tax audits.
83. **Master Sales Daybook (.xlsx)**: Comprehensive flat journal combining GST Invoices, Retail Estimates, and B2B Mechanic Bills for direct import into TallyPrime and CA Daybooks.
84. **Statutory GSTIN Format Validator**: RegEx validation (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`) scanning all buyer GSTINs prior to export.
85. **GSTIN Error Warning Banner**: Prominent amber alert card detailing invalid GSTINs and offending invoice numbers to prevent portal rejection.

---

## 10. Financial Reports & Business Analytics
86. **Profit & Loss (P&L) Engine**: Calculates Gross Revenue, Cost of Goods Sold (COGS), Gross Profit, and Profit Margin percentage.
87. **Multi-Channel Revenue Segregation**: Individual metrics for Retail GST Turnover, Retail Estimates, and B2B Mechanic Wholesale.
88. **Revenue Trends & Charts**: Time-series analysis of daily, monthly, and quarterly sales trajectory.
89. **Top-Selling Spares Ranking**: Identifies high-velocity inventory items by sales volume and profitability.
90. **Technician Job Performance Metrics**: Tracks assigned repair jobs, completed repairs, and bill volume per technician.
91. **Customer Repeat Analytics**: Monitors repeat customer visit frequencies and outstanding payment behavior.

---

## 11. Role-Based Access Control & Security
92. **Dual User Roles**: **Super Admin** (Shop Owner) vs **Admin** (Counter Staff).
93. **Password-Protected Elevation**: Switching from Staff to Super Admin requires entering the secure Super Admin password.
94. **Protected Commercial Data**: Buy prices, profit margins, financial reports, and factory reset tools are restricted to Super Admin.
95. **Role Indicator Badge**: Live status badge in TopBar indicating current active session privileges.

---

## 12. i18n Trilingual Engine (English, Marathi, Hindi)
96. **Instant Language Switcher**: 1-click header toggle between **English**, **मराठी (Marathi)**, and **हिन्दी (Hindi)**.
97. **100% Navigation Localization**: All sidebar tabs, section titles, table headers, and action buttons translate dynamically without page reload.
98. **Localized WhatsApp Communication**: Automatically generates customer reminders and bills in the selected language.

---

## 13. Core Performance & Storage Architecture
99. **Ultra-Fast RAM Caching (`memCache`)**: In-memory write-through caching providing ~0.005 ms retrieval latency for instant UI rendering.
100. **100% Offline-First Operation**: Runs entirely offline on local premises without requiring an internet connection.
101. **JSON Database Backup & Restore**: 1-click full database export and import for disaster recovery and pendrive backups.
102. **Local SQLite File Persistence Ready**: Architecture ready for native desktop SQLite database file (`starline.db`) under Electron.
103. **Zero Hardcoded Data Clean Slate**: Clean initial state without mock data, starting from zero records for fresh shop deployment.
104. **Single-File Portable `.exe` Packaging**: Standalone executable (`Starline-CRM-Portable.exe`) with zero installer setup wizard.
