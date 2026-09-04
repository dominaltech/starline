export type Language = 'en' | 'mr' | 'hi';

export interface Translations {
  // Navigation & Sections
  nav_new_invoice: string;
  nav_bill_history: string;
  nav_customers: string;
  nav_products: string;
  nav_racks: string;
  nav_credit_notes: string;
  nav_udhar: string;
  nav_b2b: string;
  nav_services: string;
  nav_amc: string;
  nav_notes: string;
  nav_analytics: string;
  nav_reports: string;
  nav_gst: string;
  nav_settings: string;
  nav_billing_section: string;
  nav_management_section: string;
  nav_finance_section: string;
  nav_system_section: string;

  // B2B Billing
  b2b_title: string;
  b2b_mechanic: string;
  b2b_date: string;
  b2b_payment_method: string;
  b2b_add_item: string;
  b2b_product_name: string;
  b2b_qty: string;
  b2b_price: string;
  b2b_total: string;
  b2b_voice_search: string;
  b2b_upload_image: string;
  b2b_bulk_upload: string;
  b2b_save_bill: string;
  b2b_history: string;

  // Services
  svc_title: string;
  svc_customer: string;
  svc_service_name: string;
  svc_price: string;
  svc_date: string;
  svc_status: string;
  svc_notes: string;
  svc_worker: string;
  svc_whatsapp: string;
  svc_status_not_started: string;
  svc_status_in_progress: string;
  svc_status_done: string;
  svc_add: string;

  // Notes
  notes_title: string;
  notes_search_products: string;
  notes_send_to_dealer: string;
  notes_select_dealer: string;
  notes_save: string;
  notes_new: string;
  notes_lang_toggle: string;
  notes_order_mode: string;

  // Settings Dealers
  settings_dealers_title: string;
  settings_add_dealer: string;
  settings_dealer_name: string;
  settings_dealer_phone: string;
  settings_dealer_spec: string;

  // Udhar & Credit Management
  udhar_title: string;
  udhar_total_outstanding: string;
  udhar_customers_count: string;
  udhar_collected_recent: string;
  udhar_pending_followups: string;
  udhar_record_vasuli: string;
  udhar_add_credit: string;
  udhar_whatsapp_reminder: string;
  udhar_follow_up_date: string;
  udhar_follow_up_note: string;
  udhar_filter_all: string;
  udhar_filter_active: string;
  udhar_filter_settled: string;
  udhar_filter_overdue: string;
  udhar_search_placeholder: string;
  udhar_last_payment: string;

  // Header & TopBar
  topbar_terminal: string;
  topbar_today: string;
  topbar_dues: string;
  topbar_low_stock: string;
  topbar_super_admin: string;
  topbar_admin: string;

  // Common Actions
  action_save: string;
  action_save_bill: string;
  action_save_print: string;
  action_clear: string;
  action_cancel: string;
  action_delete: string;
  action_edit: string;
  action_search: string;
  action_filter: string;
  action_export_pdf: string;
  action_export_image: string;
  action_export_excel: string;
  action_export_json: string;
  action_add_item: string;
  action_add_customer: string;
  action_add_product: string;
  action_combine_stock: string;
  action_close: string;
  action_reprint: string;
  action_view_ledger: string;

  // Billing Screen
  bill_mode_estimate: string;
  bill_mode_gst: string;
  bill_title_estimate: string;
  bill_title_gst: string;
  bill_date: string;
  bill_invoice_no: string;
  bill_cust_name_label: string;
  bill_cust_search_placeholder: string;
  bill_mobile_no: string;
  bill_address: string;
  bill_gstin: string;
  bill_appliance: string;
  bill_brand_model: string;
  bill_amc_from: string;
  bill_amc_to: string;
  bill_spares_section: string;
  bill_spares_hint: string;
  bill_col_sr: string;
  bill_col_item: string;
  bill_col_rate: string;
  bill_col_disc: string;
  bill_col_qty: string;
  bill_col_amount: string;
  bill_rupees_in_words: string;
  bill_assigned_worker: string;
  bill_worker_none: string;
  bill_amount_received: string;
  bill_terms_conditions: string;
  bill_taxable_subtotal: string;
  bill_cgst: string;
  bill_sgst: string;
  bill_grand_total: string;
  bill_saved_success: string;

  // Job Statuses
  status_work_done: string;
  status_in_progress: string;
  status_cancelled: string;

  // Inventory & Stock
  inv_title: string;
  inv_stock_level: string;
  inv_selling_price: string;
  inv_buy_price: string;
  inv_sku: string;
  inv_hsn: string;
  inv_rack_section: string;
  inv_min_alert: string;

  // Customers
  cust_title: string;
  cust_dues_balance: string;
  cust_record_payment: string;
  cust_total_spent: string;
  cust_billing_history: string;

  // Analytics
  analytics_title: string;
  analytics_total_revenue: string;
  analytics_avg_ticket: string;
  analytics_gross_profit: string;
  analytics_monthly_trend: string;
  analytics_split_title: string;
  analytics_top_spares: string;
  analytics_technician_kpi: string;

  // Settings
  settings_title: string;
  settings_shop_name: string;
  settings_tagline: string;
  settings_mobiles: string;
  settings_address: string;
  settings_data_backup: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    nav_new_invoice: 'New Invoice',
    nav_bill_history: 'Bill History',
    nav_customers: 'Customers & CRM',
    nav_products: 'Products & Stock',
    nav_racks: 'Physical Racks',
    nav_credit_notes: 'Returns',
    nav_udhar: 'Udhar Khata (Dues)',
    nav_b2b: 'B2B Daily Billing',
    nav_services: 'Services',
    nav_amc: 'AMC Contracts',
    nav_notes: 'Notes & Orders',
    nav_analytics: 'Analytics & Insights',
    nav_reports: 'CA Reports / P&L',
    nav_gst: 'GST Filing Hub',
    nav_settings: 'Settings & Backups',
    nav_billing_section: 'Billing',
    nav_management_section: 'Management',
    nav_finance_section: 'Finance',
    nav_system_section: 'System',

    // B2B Billing
    b2b_title: 'B2B Daily Mechanic Billing',
    b2b_mechanic: 'Mechanic Name',
    b2b_date: 'Bill Date',
    b2b_payment_method: 'Payment Method',
    b2b_add_item: '+ Add Item',
    b2b_product_name: 'Product / Part Name',
    b2b_qty: 'Qty',
    b2b_price: 'Price (₹)',
    b2b_total: 'Total (₹)',
    b2b_voice_search: 'Voice Search',
    b2b_upload_image: 'Upload Image',
    b2b_bulk_upload: 'Bulk Image Upload',
    b2b_save_bill: 'Save B2B Bill',
    b2b_history: 'B2B Bill History',

    // Services
    svc_title: 'Services Manager',
    svc_customer: 'Customer',
    svc_service_name: 'Service Name',
    svc_price: 'Service Price (₹)',
    svc_date: 'Service Date',
    svc_status: 'Status',
    svc_notes: 'Service Notes',
    svc_worker: 'Assigned Mechanic',
    svc_whatsapp: 'Send WhatsApp',
    svc_status_not_started: 'Not Started',
    svc_status_in_progress: 'In Progress',
    svc_status_done: 'Done',
    svc_add: '+ Add Service Record',

    // Notes
    notes_title: 'Notes & Dealer Orders',
    notes_search_products: 'Search products to add...',
    notes_send_to_dealer: 'Send to Dealer (WhatsApp)',
    notes_select_dealer: 'Select Dealer',
    notes_save: 'Save Note',
    notes_new: 'New Note',
    notes_lang_toggle: 'Message Language',
    notes_order_mode: 'What to Order Mode',

    // Settings Dealers
    settings_dealers_title: 'Wholesale Dealers & Suppliers',
    settings_add_dealer: '+ Add New Dealer',
    settings_dealer_name: 'Dealer / Shop Name',
    settings_dealer_phone: '10-Digit WhatsApp Number',
    settings_dealer_spec: 'Specialization / Supply items',

    udhar_title: 'Udhar & Customer Credit Management',
    udhar_total_outstanding: 'Total Outstanding Udhar',
    udhar_customers_count: 'Customers with Dues',
    udhar_collected_recent: 'Recent Collections / Vasuli',
    udhar_pending_followups: 'Pending Follow-ups',
    udhar_record_vasuli: 'Record Vasuli / Payment',
    udhar_add_credit: '+ Add New Udhar Record',
    udhar_whatsapp_reminder: 'Send WhatsApp Reminder',
    udhar_follow_up_date: 'Next Follow-up Date',
    udhar_follow_up_note: 'Follow-up Remarks / Promise Date',
    udhar_filter_all: 'All Udhar Accounts',
    udhar_filter_active: 'Active Dues (> ₹0)',
    udhar_filter_settled: 'Settled (₹0)',
    udhar_filter_overdue: 'Follow-up Due / Overdue',
    udhar_search_placeholder: 'Search customer name, mobile or area...',
    udhar_last_payment: 'Last Payment',

    topbar_terminal: 'Solapur Terminal',
    topbar_today: 'Today',
    topbar_dues: 'Dues',
    topbar_low_stock: 'low stock',
    topbar_super_admin: 'Super Admin (Full Access)',
    topbar_admin: 'Admin (Cost Hidden)',

    action_save: 'Save',
    action_save_bill: 'Save Bill',
    action_save_print: 'Save & Print (A5)',
    action_clear: 'Clear',
    action_cancel: 'Cancel',
    action_delete: 'Delete',
    action_edit: 'Edit',
    action_search: 'Search...',
    action_filter: 'Filter',
    action_export_pdf: 'Export PDF',
    action_export_image: 'Export Image',
    action_export_excel: 'Export Excel (.xlsx)',
    action_export_json: 'Export JSON',
    action_add_item: 'Add Line Item',
    action_add_customer: 'Add Customer',
    action_add_product: 'Add Spare / Product',
    action_combine_stock: 'Combine Stock',
    action_close: 'Close',
    action_reprint: 'Print A5',
    action_view_ledger: 'View Ledger',

    bill_mode_estimate: 'Estimate (Non-GST)',
    bill_mode_gst: 'GST Tax Invoice (18%)',
    bill_title_estimate: 'INVOICE / CUM RECEIPT',
    bill_title_gst: 'TAX INVOICE / CUM RECEIPT',
    bill_date: 'Date',
    bill_invoice_no: 'Invoice No',
    bill_cust_name_label: 'Received with thanks from (Customer Name)',
    bill_cust_search_placeholder: 'Type name or mobile to auto-suggest / auto-create...',
    bill_mobile_no: 'Customer Mobile No',
    bill_address: 'Address / Area',
    bill_gstin: 'GSTIN (for B2B)',
    bill_appliance: 'Appliance / Product Description',
    bill_brand_model: 'Brand & Model No.',
    bill_amc_from: 'AMC From',
    bill_amc_to: 'AMC To',
    bill_spares_section: 'SPARES REPLACED',
    bill_spares_hint: 'Items typed on-the-fly will automatically create new catalog items upon saving.',
    bill_col_sr: 'Sr.',
    bill_col_item: 'ITEM DESCRIPTION (Typeahead & Quick-Add)',
    bill_col_rate: 'RATE (₹)',
    bill_col_disc: 'DISC %',
    bill_col_qty: 'QTY.',
    bill_col_amount: 'AMOUNT (₹)',
    bill_rupees_in_words: 'Rupees in Word :',
    bill_assigned_worker: 'Assigned Technician / Worker :',
    bill_worker_none: '-- None (Counter Pickup) --',
    bill_amount_received: 'Amount Received (₹) :',
    bill_terms_conditions: 'Terms & Conditions :',
    bill_taxable_subtotal: 'Taxable Subtotal',
    bill_cgst: 'CGST (9%)',
    bill_sgst: 'SGST (9%)',
    bill_grand_total: 'TOTAL',
    bill_saved_success: 'Invoice saved & catalog updated!',

    status_work_done: 'Work Done',
    status_in_progress: 'In Progress',
    status_cancelled: 'Cancelled',

    inv_title: 'Inventory & Spares Catalog',
    inv_stock_level: 'Stock Level',
    inv_selling_price: 'Selling Price',
    inv_buy_price: 'Purchase Cost',
    inv_sku: 'Type',
    inv_hsn: 'HSN Code',
    inv_rack_section: 'Rack / Section',
    inv_min_alert: 'Min Stock Alert',

    cust_title: 'Customer Directory & CRM',
    cust_dues_balance: 'Outstanding Dues',
    cust_record_payment: 'Record Payment',
    cust_total_spent: 'Total Business',
    cust_billing_history: 'Invoice History',

    analytics_title: 'Analytics & Performance Visualizer',
    analytics_total_revenue: 'Total Sales Revenue',
    analytics_avg_ticket: 'Avg. Ticket / Invoice Size',
    analytics_gross_profit: 'Gross Profit & Margin',
    analytics_monthly_trend: 'Monthly Revenue Trend',
    analytics_split_title: 'GST vs Estimate Split',
    analytics_top_spares: 'Top Selling Spare Parts & Revenue',
    analytics_technician_kpi: 'Technician Job Status & Productivity',

    settings_title: 'Store Settings & Backups',
    settings_shop_name: 'Shop / Business Name',
    settings_tagline: 'Tagline & Subtitle',
    settings_mobiles: 'Mobile Numbers',
    settings_address: 'Shop Address',
    settings_data_backup: 'Local Database JSON Backup & Restore'
  },

  mr: {
    nav_new_invoice: 'नवीन बिल',
    nav_bill_history: 'बिल इतिहास',
    nav_customers: 'ग्राहक व CRM',
    nav_products: 'साहित्य व साठा',
    nav_racks: 'रॅक व कप्पे',
    nav_credit_notes: 'रिटर्न्स (Returns)',
    nav_udhar: 'उधार खाते (बाकी)',
    nav_b2b: 'B2B दैनिक बिलिंग',
    nav_services: 'सेवा व्यवस्थापन',
    nav_amc: 'AMC करार',
    nav_notes: 'नोट्स व ऑर्डर',
    nav_analytics: 'विश्लेषण व आकडेवारी',
    nav_reports: 'सीए अहवाल / नफा-तोटा',
    nav_gst: 'जीएसटी केंद्र',
    nav_settings: 'सेटिंग्ज व बॅकअप',
    nav_billing_section: 'बिलिंग',
    nav_management_section: 'व्यवस्थापन',
    nav_finance_section: 'आर्थिक',
    nav_system_section: 'सिस्टम',

    // B2B Billing
    b2b_title: 'B2B मेकॅनिक दैनिक बिलिंग',
    b2b_mechanic: 'मेकॅनिकचे नाव',
    b2b_date: 'बिल दिनांक',
    b2b_payment_method: 'पैसे भरण्याची पद्धत',
    b2b_add_item: '+ नवीन वस्तू जोडा',
    b2b_product_name: 'सुटे भाग / वस्तूचे नाव',
    b2b_qty: 'नग (Qty)',
    b2b_price: 'दर (₹)',
    b2b_total: 'एकूण (₹)',
    b2b_voice_search: 'व्हॉइस सर्च (आवाजाने शोधा)',
    b2b_upload_image: 'फोटो जोडा',
    b2b_bulk_upload: 'एकाच वेळी अनेक फोटो जोडा',
    b2b_save_bill: 'B2B बिल जतन करा',
    b2b_history: 'B2B बिल इतिहास',

    // Services
    svc_title: 'सेवा व्यवस्थापन (Services CRM)',
    svc_customer: 'ग्राहक नाव',
    svc_service_name: 'सेवेचे नाव',
    svc_price: 'सेवा शुल्क (₹)',
    svc_date: 'सेवा दिनांक',
    svc_status: 'स्थिती',
    svc_notes: 'सेवा शेरा / टीप',
    svc_worker: 'नियुक्त मेकॅनिक',
    svc_whatsapp: 'व्हॉट्सॲप मेसेज पाठवा',
    svc_status_not_started: 'सुरू नाही',
    svc_status_in_progress: 'काम चालू',
    svc_status_done: 'काम पूर्ण',
    svc_add: '+ नवीन सेवा नोंदवा',

    // Notes
    notes_title: 'नोट्स व डीलर खरेदी ऑर्डर',
    notes_search_products: 'साहित्य शोधून नोट्समध्ये जोडा...',
    notes_send_to_dealer: 'डीलरला व्हॉट्सॲप पाठवा',
    notes_select_dealer: 'डीलर निवडा',
    notes_save: 'नोट जतन करा',
    notes_new: 'नवीन नोट',
    notes_lang_toggle: 'मेसेज भाषा',
    notes_order_mode: 'काय ऑर्डर करायचे मोड',

    // Settings Dealers
    settings_dealers_title: 'घाऊक डीलर व पुरवठादार यादी',
    settings_add_dealer: '+ नवीन डीलर जोडा',
    settings_dealer_name: 'डीलर / दुकानाचे नाव',
    settings_dealer_phone: '10-अंकी व्हॉट्सॲप नंबर',
    settings_dealer_spec: 'साहित्य प्रकार / स्पेशलायझेशन',

    udhar_title: 'उधार खाते व ग्राहक बाकी व्यवस्थापन',
    udhar_total_outstanding: 'एकूण बाकी रक्कम',
    udhar_customers_count: 'बाकीदार ग्राहक संख्या',
    udhar_collected_recent: 'अलीकडील जमा रक्कम (वसूली)',
    udhar_pending_followups: 'प्रलंबित फॉलो-अप्स',
    udhar_record_vasuli: 'जमा नोंदवा (वसूली)',
    udhar_add_credit: '+ नवीन उधार नोंदवा',
    udhar_whatsapp_reminder: 'व्हॉट्सॲप स्मरणपत्र पाठवा',
    udhar_follow_up_date: 'पुढील फॉलो-अप तारीख',
    udhar_follow_up_note: 'फॉलो-अप शेरा / तारीख',
    udhar_filter_all: 'सर्व खाती',
    udhar_filter_active: 'चालू बाकी (> ₹0)',
    udhar_filter_settled: 'पूर्ण जमा (₹0)',
    udhar_filter_overdue: 'फॉलो-अप देणे बाकी',
    udhar_search_placeholder: 'ग्राहकाचे नाव, मोबाईल किंवा परिसर शोधा...',
    udhar_last_payment: 'शेवटची जमा रक्कम',

    topbar_terminal: 'सोलापूर टर्मिनल',
    topbar_today: 'आजची विक्री',
    topbar_dues: 'बाकी रक्कम',
    topbar_low_stock: 'कमी साठा',
    topbar_super_admin: 'सुपर ॲडमिन (पूर्ण अधिकार)',
    topbar_admin: 'ॲडमिन (खरेदी दर लपवलेले)',

    action_save: 'जतन करा',
    action_save_bill: 'बिल जतन करा',
    action_save_print: 'जतन व प्रिंट (A5)',
    action_clear: 'साफ करा',
    action_cancel: 'रद्द करा',
    action_delete: 'हटवा',
    action_edit: 'बदला',
    action_search: 'शोधा...',
    action_filter: 'फिल्टर',
    action_export_pdf: 'PDF डाउनलोड करा',
    action_export_image: 'फोटो डाउनलोड करा',
    action_export_excel: 'Excel (.xlsx) डाउनलोड',
    action_export_json: 'JSON डाउनलोड करा',
    action_add_item: '+ नवीन साहित्य ओळ जोडा',
    action_add_customer: '+ नवीन ग्राहक जोडा',
    action_add_product: '+ नवीन सुटे भाग / साहित्य जोडा',
    action_combine_stock: 'साठा एकत्र करा',
    action_close: 'बंद करा',
    action_reprint: 'A5 प्रिंट',
    action_view_ledger: 'खातेवही पहा',

    bill_mode_estimate: 'अंदाजपत्रक / एस्टीमेट (विना जीएसटी)',
    bill_mode_gst: 'जीएसटी टॅक्स इन्व्हॉइस (18%)',
    bill_title_estimate: 'इन्व्हॉइस / पावती',
    bill_title_gst: 'टॅक्स इन्व्हॉइस / पावती',
    bill_date: 'दिनांक',
    bill_invoice_no: 'बिल क्र.',
    bill_cust_name_label: 'ग्राहक नाव (शोधा किंवा नवीन लिहा)',
    bill_cust_search_placeholder: 'ग्राहकाचे नाव किंवा मोबाईल नंबर टाका...',
    bill_mobile_no: 'ग्राहकाचा मोबाईल नंबर',
    bill_address: 'पत्ता / परिसर',
    bill_gstin: 'जीएसटी नंबर (B2B साठी)',
    bill_appliance: 'उपकरण / साहित्याचे नाव',
    bill_brand_model: 'कंपनी व मॉडेल क्र.',
    bill_amc_from: 'एएमसी पासून',
    bill_amc_to: 'एएमसी पर्यंत',
    bill_spares_section: 'बदललेले सुटे भाग (SPARES REPLACED)',
    bill_spares_hint: 'नवीन नाव लिहिल्यास आपोआप साठ्यामध्ये समाविष्ट होईल.',
    bill_col_sr: 'क्र.',
    bill_col_item: 'साहित्याचे नाव व तपशील',
    bill_col_rate: 'दर (₹)',
    bill_col_disc: 'सूट %',
    bill_col_qty: 'नग (QTY)',
    bill_col_amount: 'रक्कम (₹)',
    bill_rupees_in_words: 'अक्षरी रक्कम :',
    bill_assigned_worker: 'नियुक्त मेकॅनिक / तंत्रज्ञ :',
    bill_worker_none: '-- काउंटर डिलिव्हरी (कोणी नाही) --',
    bill_amount_received: 'मिळालेली रक्कम (₹) :',
    bill_terms_conditions: 'नियम व अटी :',
    bill_taxable_subtotal: 'करपात्र रक्कम',
    bill_cgst: 'CGST (9%)',
    bill_sgst: 'SGST (9%)',
    bill_grand_total: 'एकूण रक्कम (TOTAL)',
    bill_saved_success: 'बिल यशस्वीरित्या जतन झाले!',

    status_work_done: 'काम पूर्ण (Work Done)',
    status_in_progress: 'काम चालू (In Progress)',
    status_cancelled: 'रद्द (Cancelled)',

    inv_title: 'सुटे भाग व साठा सूची (Inventory)',
    inv_stock_level: 'उपलब्ध साठा',
    inv_selling_price: 'विक्री दर',
    inv_buy_price: 'खरेदी दर',
    inv_sku: 'प्रकार',
    inv_hsn: 'HSN कोड',
    inv_rack_section: 'रॅक / कप्पा',
    inv_min_alert: 'किमान साठा इशारा',

    cust_title: 'ग्राहक सूची व CRM',
    cust_dues_balance: 'एकूण बाकी रक्कम',
    cust_record_payment: 'जमा रक्कम नोंदवा',
    cust_total_spent: 'एकूण व्यवहार',
    cust_billing_history: 'बिलांचा इतिहास',

    analytics_title: 'व्यवसाय विश्लेषण व आकडेवारी',
    analytics_total_revenue: 'एकूण विक्री महसूल',
    analytics_avg_ticket: 'सरासरी बिल मूल्य',
    analytics_gross_profit: 'एकूण नफा व मार्जिन',
    analytics_monthly_trend: 'मासिक विक्री कल (Revenue Trend)',
    analytics_split_title: 'जीएसटी वि. एस्टीमेट प्रमाण',
    analytics_top_spares: 'सर्वाधिक खपाचे सुटे भाग व उत्पन्न',
    analytics_technician_kpi: 'मेकॅनिक काम स्थिती व कामगिरी',

    settings_title: 'दुकान माहिती व बॅकअप',
    settings_shop_name: 'दुकान / व्यवसायाचे नाव',
    settings_tagline: 'घोषवाक्य / टॅगलाईन',
    settings_mobiles: 'मोबाईल नंबर',
    settings_address: 'दुकान पत्ता',
    settings_data_backup: 'स्थानिक डेटाबेस JSON बॅकअप व रिस्टोअर'
  },

  hi: {
    nav_new_invoice: 'नया बिल',
    nav_bill_history: 'बिल इतिहास',
    nav_customers: 'ग्राहक एवं CRM',
    nav_products: 'उत्पाद एवं स्टॉक',
    nav_racks: 'रैक एवं सेक्शन',
    nav_credit_notes: 'रिटर्न्स (Returns)',
    nav_udhar: 'उधार खाता (बकाया)',
    nav_b2b: 'B2B दैनिक बिलिंग',
    nav_services: 'सेवा प्रबंधन',
    nav_amc: 'एएमसी अनुबंध',
    nav_notes: 'नोट्स एवं ऑर्डर',
    nav_analytics: 'विश्लेषण एवं आंकड़े',
    nav_reports: 'सीए रिपोर्ट्स / लाभ-हानि',
    nav_gst: 'जीएसटी फाइलिंग हब',
    nav_settings: 'सेटिंग्स एवं बैकअप',
    nav_billing_section: 'बिलिंग',
    nav_management_section: 'प्रबंधन',
    nav_finance_section: 'वित्त',
    nav_system_section: 'सिस्टम',

    // B2B Billing
    b2b_title: 'B2B मैकेनिक दैनिक बिलिंग',
    b2b_mechanic: 'मैकेनिक का नाम',
    b2b_date: 'बिल दिनांक',
    b2b_payment_method: 'भुगतान विधि',
    b2b_add_item: '+ नया आइटम जोड़ें',
    b2b_product_name: 'स्पेयर पार्ट / आइटम नाम',
    b2b_qty: 'मात्रा (Qty)',
    b2b_price: 'मूल्य (₹)',
    b2b_total: 'कुल (₹)',
    b2b_voice_search: 'वॉइस सर्च (आवाज से खोजें)',
    b2b_upload_image: 'फोटो अपलोड करें',
    b2b_bulk_upload: 'एक साथ कई फोटो अपलोड करें',
    b2b_save_bill: 'B2B बिल सुरक्षित करें',
    b2b_history: 'B2B बिल इतिहास',

    // Services
    svc_title: 'सेवा प्रबंधन (Services CRM)',
    svc_customer: 'ग्राहक का नाम',
    svc_service_name: 'सेवा का नाम',
    svc_price: 'सेवा शुल्क (₹)',
    svc_date: 'सेवा दिनांक',
    svc_status: 'स्थिति',
    svc_notes: 'सेवा टिप्पणी',
    svc_worker: 'नियुक्त मैकेनिक',
    svc_whatsapp: 'व्हाट्सएप भेजें',
    svc_status_not_started: 'प्रारंभ नहीं',
    svc_status_in_progress: 'कार्य प्रगति पर',
    svc_status_done: 'कार्य पूर्ण',
    svc_add: '+ नई सेवा जोड़ें',

    // Notes
    notes_title: 'नोट्स एवं डीलर ऑर्डर',
    notes_search_products: 'स्पेयर पार्ट खोजें और जोड़ें...',
    notes_send_to_dealer: 'डीलर को व्हाट्सएप भेजें',
    notes_select_dealer: 'डीलर चुनें',
    notes_save: 'नोट सुरक्षित करें',
    notes_new: 'नया नोट',
    notes_lang_toggle: 'संदेश भाषा',
    notes_order_mode: 'क्या ऑर्डर करना है मोड',

    // Settings Dealers
    settings_dealers_title: 'थोक डीलर एवं आपूर्तिकर्ता',
    settings_add_dealer: '+ नया डीलर जोड़ें',
    settings_dealer_name: 'डीलर / दुकान का नाम',
    settings_dealer_phone: '10-अंकीय व्हाट्सएप नंबर',
    settings_dealer_spec: 'विशेषज्ञता / सप्लाई पार्ट्स',

    udhar_title: 'उधार खाता एवं ग्राहक बकाया प्रबंधन',
    udhar_total_outstanding: 'कुल बकाया राशि',
    udhar_customers_count: 'बकायादार ग्राहक संख्या',
    udhar_collected_recent: 'हाल की जमा राशि (वसूली)',
    udhar_pending_followups: 'लंबित फॉलो-अप',
    udhar_record_vasuli: 'जमा राशि दर्ज करें (वसूली)',
    udhar_add_credit: '+ नया उधार जोड़ें',
    udhar_whatsapp_reminder: 'व्हाट्सएप रिमाइंडर भेजें',
    udhar_follow_up_date: 'अगली फॉलो-अप तिथि',
    udhar_follow_up_note: 'फॉलो-अप टिप्पणी / वादा तिथि',
    udhar_filter_all: 'सभी खाते',
    udhar_filter_active: 'सक्रिय बकाया (> ₹0)',
    udhar_filter_settled: 'पूर्ण भुगतान (₹0)',
    udhar_filter_overdue: 'फॉलो-अप देय',
    udhar_search_placeholder: 'ग्राहक का नाम, मोबाइल या क्षेत्र खोजें...',
    udhar_last_payment: 'अंतिम जमा राशि',

    topbar_terminal: 'सोलापुर टर्मिनल',
    topbar_today: 'आज की बिक्री',
    topbar_dues: 'बकाया राशि',
    topbar_low_stock: 'कम स्टॉक',
    topbar_super_admin: 'सुपर एडमिन (पूर्ण अधिकार)',
    topbar_admin: 'एडमिन (लागत मूल्य छिपा हुआ)',

    action_save: 'सुरक्षित करें',
    action_save_bill: 'बिल सुरक्षित करें',
    action_save_print: 'सुरक्षित व प्रिंट (A5)',
    action_clear: 'साफ करें',
    action_cancel: 'रद्द करें',
    action_delete: 'हटाएं',
    action_edit: 'संशोधित करें',
    action_search: 'खोजें...',
    action_filter: 'फ़िल्टर',
    action_export_pdf: 'PDF डाउनलोड करें',
    action_export_image: 'फोटो डाउनलोड करें',
    action_export_excel: 'Excel (.xlsx) डाउनलोड',
    action_export_json: 'JSON डाउनलोड करें',
    action_add_item: '+ नया आइटम जोड़ें',
    action_add_customer: '+ नया ग्राहक जोड़ें',
    action_add_product: '+ नया स्पेयर पार्ट जोड़ें',
    action_combine_stock: 'स्टॉक मर्ज करें',
    action_close: 'बंद करें',
    action_reprint: 'A5 प्रिंट',
    action_view_ledger: 'खाता बही देखें',

    bill_mode_estimate: 'एस्टीमेट (गैर-जीएसटी)',
    bill_mode_gst: 'जीएसटी टैक्स इनवॉइस (18%)',
    bill_title_estimate: 'इनवॉइस / रसीद',
    bill_title_gst: 'टैक्स इनवॉइस / रसीद',
    bill_date: 'दिनांक',
    bill_invoice_no: 'बिल क्र.',
    bill_cust_name_label: 'ग्राहक का नाम (खोजें या नया लिखें)',
    bill_cust_search_placeholder: 'ग्राहक का नाम या मोबाइल नंबर दर्ज करें...',
    bill_mobile_no: 'ग्राहक का मोबाइल नंबर',
    bill_address: 'पता / क्षेत्र',
    bill_gstin: 'जीएसटी नंबर (B2B के लिए)',
    bill_appliance: 'उपकरण / उत्पाद का विवरण',
    bill_brand_model: 'ब्रांड एवं मॉडल क्र.',
    bill_amc_from: 'एएमसी प्रारंभ',
    bill_amc_to: 'एएमसी समाप्ति',
    bill_spares_section: 'बदले गए स्पेयर पार्ट्स (SPARES REPLACED)',
    bill_spares_hint: 'नया पार्ट लिखने पर वह अपने आप स्टॉक में जुड़ जाएगा।',
    bill_col_sr: 'क्र.',
    bill_col_item: 'स्पेयर पार्ट विवरण (Typeahead)',
    bill_col_rate: 'दर (₹)',
    bill_col_disc: 'छूट %',
    bill_col_qty: 'मात्रा (QTY)',
    bill_col_amount: 'राशि (₹)',
    bill_rupees_in_words: 'शब्दों में राशि :',
    bill_assigned_worker: 'नियुक्त मैकेनिक / तकनीशियन :',
    bill_worker_none: '-- काउंटर पिकअप (कोई नहीं) --',
    bill_amount_received: 'प्राप्त राशि (₹) :',
    bill_terms_conditions: 'नियम एवं शर्तें :',
    bill_taxable_subtotal: 'कर योग्य उप-योग',
    bill_cgst: 'CGST (9%)',
    bill_sgst: 'SGST (9%)',
    bill_grand_total: 'कुल योग (TOTAL)',
    bill_saved_success: 'बिल सफलतापूर्वक सुरक्षित हो गया!',

    status_work_done: 'कार्य पूर्ण (Work Done)',
    status_in_progress: 'कार्य प्रगति पर (In Progress)',
    status_cancelled: 'रद्द (Cancelled)',

    inv_title: 'स्पेयर पार्ट्स एवं स्टॉक सूची (Inventory)',
    inv_stock_level: 'उपलब्ध स्टॉक',
    inv_selling_price: 'विक्री मूल्य',
    inv_buy_price: 'खरीद लागत',
    inv_sku: 'प्रकार',
    inv_hsn: 'HSN कोड',
    inv_rack_section: 'रैक / सेक्शन',
    inv_min_alert: 'न्यूनतम स्टॉक चेतावनी',

    cust_title: 'ग्राहक सूची एवं CRM',
    cust_dues_balance: 'कुल बकाया राशि',
    cust_record_payment: 'जमा राशि दर्ज करें',
    cust_total_spent: 'कुल व्यापार',
    cust_billing_history: 'बिल इतिहास',

    analytics_title: 'व्यापार विश्लेषण एवं आंकड़े',
    analytics_total_revenue: 'कुल बिक्री राजस्व',
    analytics_avg_ticket: 'औसत बिल आकार',
    analytics_gross_profit: 'सकल लाभ एवं मार्जिन',
    analytics_monthly_trend: 'मासिक बिक्री रुझान (Revenue Trend)',
    analytics_split_title: 'जीएसटी बनाम एस्टीमेट अनुपात',
    analytics_top_spares: 'सर्वाधिक बिकने वाले स्पेयर पार्ट्स',
    analytics_technician_kpi: 'मैकेनिक कार्य स्थिति एवं उत्पादकता',

    settings_title: 'दुकान सेटिंग्स एवं बैकअप',
    settings_shop_name: 'दुकान / व्यापार का नाम',
    settings_tagline: 'टैगलाइन / उपशीर्षक',
    settings_mobiles: 'मोबाइल नंबर',
    settings_address: 'दुकान का पता',
    settings_data_backup: 'स्थानीय डेटाबेस JSON बैकअप एवं पुनर्स्थापना'
  }
};
