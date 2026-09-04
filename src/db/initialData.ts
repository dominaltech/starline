import { Customer, Product, Section, Worker, Mechanic, AMCContract, ShopSettings, User } from '../types';

export const INITIAL_SETTINGS: ShopSettings = {
  shop_name: 'STAR LINE SERVICES',
  tagline: 'Repair : All Types of Air Condition, Refrigerator, Washing Machine, Micro Oven & Home Appliances',
  address_line1: 'Shop No. 3, Anvar Estate, South Sadar Bazar,',
  address_line2: 'Lashkar, Solapur.',
  city: 'Solapur',
  state_code: '27',
  state_name: 'Maharashtra',
  pincode: '413003',
  mobiles: '7775038897 / 7776011808',
  gstin: '27ADEPW8222B1ZL',
  starting_invoice_num: 981,
  starting_credit_note_num: 101,
  default_cgst_rate: 9,
  default_sgst_rate: 9,
  default_conditions: '(Spare and Accessories once sold will not be taken back)\nAll Part Sold in exchange of Defective part.',
  dealers: [
    {
      id: 'dlr_1',
      name: 'Pooja Refrigeration Spares Wholesale',
      phone: '9822012345',
      specialization: 'Fridge & Deep Freezer Spares (Relays, Thermostats)',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'dlr_2',
      name: 'Shree Samarth AC Spares & Copper Mart',
      phone: '9423067890',
      specialization: 'Copper Pipes, Refrigerant Gas R32/R410/R22, Condensers',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  super_admin_password: '123456',
  whatsapp_target: 'desktop',
  msg_template_udhar_mr:
    'नमस्कार {customer_name} जी,\n\n*{shop_name}, सोलापूर* कडून स्मरणपत्र:\nआपल्या खात्यावरील एकूण बाकी रक्कम *₹{dues_amount}* आहे.\n\nकृपया सदर बाकी रक्कम लवकरात लवकर जमा करावी ही नम्र विनंती.\nसंपर्क: {mobiles}\n\nधन्यवाद!',
  msg_template_udhar_hi:
    'नमस्ते {customer_name} जी,\n\n*{shop_name}, सोलापुर* की ओर से रिमाइंडर:\nआपके खाते पर कुल बकाया राशि *₹{dues_amount}* है।\n\nकृपया यह बकाया राशि शीघ्र जमा करने का कष्ट करें।\nसंपर्क: {mobiles}\n\nधन्यवाद!',
  msg_template_udhar_en:
    'Dear {customer_name},\n\nThis is a friendly payment reminder from *{shop_name}, Solapur*.\nYour outstanding dues balance is *₹{dues_amount}*.\n\nPlease clear the balance at your earliest convenience.\nContact: {mobiles}\n\nThank you!',
  msg_template_bill_mr:
    '*{shop_name}*\nदुकान क्र. ३, अन्वर इस्टेट, दक्षिण सदर बाजार, सोलापूर\nमोबाईल: {mobiles}\n\n*बिल / पावती तपशील*\nबिल क्र.: *#{invoice_num}*\nदिनांक: {invoice_date}\nग्राहक: {customer_name}\n{appliance_line}------------------------\n*सुटे भाग तपशील:*\n{items_list}\n------------------------\n*एकूण रक्कम (Grand Total): ₹{grand_total}*\nजमा रक्कम (Paid): ₹{paid_amount}\n*बाकी रक्कम (Dues): ₹{due_amount}*\n\nस्टार लाईन सर्व्हिसेस निवडल्याबद्दल धन्यवाद!',
  msg_template_bill_hi:
    '*{shop_name}*\nदुकान क्र. ३, अनवर एस्टेट, दक्षिण सदर बाजार, सोलापुर\nसंपर्क: {mobiles}\n\n*बिल / रसीद विवरण*\nबिल क्र.: *#{invoice_num}*\nदिनांक: {invoice_date}\nग्राहक: {customer_name}\n{appliance_line}------------------------\n*स्पेयर पार्ट्स विवरण:*\n{items_list}\n------------------------\n*कुल राशि: ₹{grand_total}*\nप्राप्त राशि: ₹{paid_amount}\n*बकाया राशि: ₹{due_amount}*\n\nस्टार लाइन सर्विसेज में सेवा का अवसर देने हेतु धन्यवाद!',
  msg_template_bill_en:
    '*{shop_name}*\nShop No. 3, Anvar Estate, South Sadar Bazar, Solapur\nContact: {mobiles}\n\n*INVOICE / RECEIPT SUMMARY*\nInvoice #: *#{invoice_num}*\nDate: {invoice_date}\nCustomer: {customer_name}\n{appliance_line}------------------------\n*Items Replaced:*\n{items_list}\n------------------------\n*Grand Total: ₹{grand_total}*\nAmount Paid: ₹{paid_amount}\n*Outstanding Dues: ₹{due_amount}*\n\nThank you for choosing Star Line Services!',
  msg_template_service_mr:
    '*{shop_name}*\nमोबाईल: {mobiles}\n\nनमस्कार {customer_name} जी,\n\nआपल्या *{service_name}* सर्व्हिस कामाची माहिती खालीलप्रमाणे आहे:\n------------------------\nतारीख: *{service_date}*\nसेवा: *{service_name}*\n{service_desc_line}सेवा शुल्क (Price): *₹{price}*\nसद्यस्थिती (Status): *{status}*\n{technician_line}{notes_line}------------------------\nकाही अडचण असल्यास कृपया संपर्क साधावा.\n\nधन्यवाद!\n*स्टार लाईन सर्व्हिसेस, सोलापूर*',
  msg_template_service_hi:
    '*{shop_name}*\nसंपर्क: {mobiles}\n\nनमस्ते {customer_name} जी,\n\nआपकी *{service_name}* सर्विस कार्य का विवरण:\n------------------------\nदिनांक: *{service_date}*\nसेवा: *{service_name}*\n{service_desc_line}सेवा शुल्क: *₹{price}*\nकार्य स्थिति: *{status}*\n{technician_line}{notes_line}------------------------\nस्टार लाइन सर्विसेज में सेवा का अवसर देने हेतु धन्यवाद!',
  msg_template_service_en:
    '*{shop_name}*\nContact: {mobiles}\n\nDear {customer_name},\n\nHere is the service status update for *{service_name}*:\n------------------------\nDate: *{service_date}*\nService: *{service_name}*\n{service_desc_line}Price: *₹{price}*\nStatus: *{status}*\n{technician_line}{notes_line}------------------------\nThank you for choosing Star Line Services!',
  msg_template_order_mr:
    '*{shop_name}, सोलापूर*\nदिनांक: {date}\nसंपर्क: {mobiles}\n\nनमस्कार,\nआम्हाला खालील सुटे भाग / साहित्य ऑर्डर करायचे आहे. कृपया दर व उपलब्धता कळवावी:\n------------------------------------\n{content}\n------------------------------------\nकृपया लवकरात लवकर पाठवून द्यावे. धन्यवाद!',
  msg_template_order_hi:
    '*{shop_name}, सोलापुर*\nदिनांक: {date}\nसंपर्क: {mobiles}\n\nनमस्ते,\nहमें निम्नलिखित स्पेयर पार्ट्स / सामग्री ऑर्डर करनी है। कृपया दर व उपलब्धता बताएं:\n------------------------------------\n{content}\n------------------------------------\nकृपया जल्द से जल्द भिजवाने की कृपा करें। धन्यवाद!',
  msg_template_order_en:
    '*{shop_name}, Solapur*\nDate: {date}\nContact: {mobiles}\n\nHello,\nWe would like to place a purchase order for the following spares/items. Please confirm rates & availability:\n------------------------------------\n{content}\n------------------------------------\nThank you!'
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_super',
    username: 'admin',
    role: 'super_admin',
    name: 'Proprietor (Super Admin)',
    created_at: new Date().toISOString()
  },
  {
    id: 'usr_staff',
    username: 'staff',
    role: 'admin',
    name: 'Counter Biller (Admin)',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_SECTIONS: Section[] = [
  { id: 'sec_1', name: 'Rack A1 — AC Parts & Copper Tubes', description: 'Compressors, condensers, 1/4 & 1/2 copper pipes', created_at: new Date().toISOString() },
  { id: 'sec_2', name: 'Rack B1 — Fridge Thermostats & Relays', description: 'Defrost timers, overload protectors, bi-metals', created_at: new Date().toISOString() },
  { id: 'sec_3', name: 'Rack C1 — Washing Machine Valves & Belts', description: 'Drain motors, inlet valves, pulsators, belts', created_at: new Date().toISOString() },
  { id: 'sec_4', name: 'Shelf D — Capacitors & Universal Spares', description: 'Run/start capacitors, fans, micro switches', created_at: new Date().toISOString() }
];

export const INITIAL_WORKERS: Worker[] = [
  { id: 'wrk_1', name: 'Ramesh Shinde', phone: '9822114433', specialization: 'AC & Inverter Specialist', is_active: true, created_at: new Date().toISOString() },
  { id: 'wrk_2', name: 'Mohsin Khan', phone: '9423556677', specialization: 'Refrigerator & Deep Freezer Tech', is_active: true, created_at: new Date().toISOString() },
  { id: 'wrk_3', name: 'Sachin Patil', phone: '8805123456', specialization: 'Washing Machine & Microwave Expert', is_active: true, created_at: new Date().toISOString() }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Anand Kulkarni',
    mobile: '9890123456',
    address: 'Flat 402, Shanti Heights, Lashkar, Solapur',
    gstin: '',
    state_code: '27',
    dues_balance: 450,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cust_2',
    name: 'Hotel Balaji Residency (B2B)',
    mobile: '9764554433',
    address: 'Old Pune Naka, Solapur',
    gstin: '27AAACA9593P1ZV',
    state_code: '27',
    dues_balance: 0,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cust_3',
    name: 'Dr. Suresh Deshmukh',
    mobile: '9422019988',
    address: 'Civil Hospital Road, Solapur',
    gstin: '',
    state_code: '27',
    dues_balance: 1200,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cust_4',
    name: 'Avenue Supermarts Solapur (B2B)',
    mobile: '9823001122',
    address: 'Jule Solapur Main Road, Solapur',
    gstin: '27AACCA8432H1ZQ',
    state_code: '27',
    dues_balance: 0,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Rotary Compressor 1.5 Ton R32',
    type: 'Compressor',
    sku: 'CMP-15-R32',
    hsn_code: '84143000',
    unit: 'NOS',
    buy_price: 4800,
    selling_price: 6800,
    stock_qty: 8,
    section_id: 'sec_1',
    min_stock_alert: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_2',
    name: 'Running Capacitor 45 MFD',
    type: 'Capacitor',
    sku: 'CAP-45-RUN',
    hsn_code: '85322500',
    unit: 'NOS',
    buy_price: 140,
    selling_price: 320,
    stock_qty: 35,
    section_id: 'sec_4',
    min_stock_alert: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_3',
    name: 'Single Door Fridge Thermostat WPF-22',
    type: 'Fridge Spares',
    sku: 'THM-WPF22',
    hsn_code: '90321010',
    unit: 'NOS',
    buy_price: 180,
    selling_price: 450,
    stock_qty: 18,
    section_id: 'sec_2',
    min_stock_alert: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_4',
    name: 'Fridge Relay + OLP Set (Universal)',
    type: 'Fridge Spares',
    sku: 'RLY-OLP-SET',
    hsn_code: '85364100',
    unit: 'SET',
    buy_price: 90,
    selling_price: 250,
    stock_qty: 42,
    section_id: 'sec_2',
    min_stock_alert: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_5',
    name: 'Washing Machine Drain Motor 220V',
    type: 'Washing Machine',
    sku: 'WM-DRN-MTR',
    hsn_code: '84509010',
    unit: 'NOS',
    buy_price: 380,
    selling_price: 850,
    stock_qty: 12,
    section_id: 'sec_3',
    min_stock_alert: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_6',
    name: 'Washing Machine Inlet Solenoid Valve Double',
    type: 'Washing Machine',
    sku: 'WM-INL-DBL',
    hsn_code: '84818030',
    unit: 'NOS',
    buy_price: 220,
    selling_price: 520,
    stock_qty: 15,
    section_id: 'sec_3',
    min_stock_alert: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_7',
    name: 'Microwave Magnetron 2M214',
    type: 'Microwave Spares',
    sku: 'MW-MAG-214',
    hsn_code: '85407100',
    unit: 'NOS',
    buy_price: 750,
    selling_price: 1500,
    stock_qty: 6,
    section_id: 'sec_4',
    min_stock_alert: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_8',
    name: 'R134a Refrigerant Can 450g',
    type: 'Gas / Refrigerant',
    sku: 'GAS-R134A-450',
    hsn_code: '29033990',
    unit: 'NOS',
    buy_price: 260,
    selling_price: 550,
    stock_qty: 24,
    section_id: 'sec_2',
    min_stock_alert: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const INITIAL_MECHANICS: Mechanic[] = [
  {
    id: 'mech_1',
    name: 'Santosh Jadhav',
    phone: '9822334455',
    workshop_name: 'Santosh AC & Fridge Care',
    address: 'Near Saat Rasta, Solapur',
    dues_balance: 650,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mech_2',
    name: 'Irfan Bagwan',
    phone: '9423112233',
    workshop_name: 'Bagwan Refrigeration Works',
    address: 'Bhavani Peth, Solapur',
    dues_balance: 0,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mech_3',
    name: 'Ganesh Shinde',
    phone: '9921445566',
    workshop_name: 'Shinde Electricals & Spares',
    address: 'Ashok Chowk, Solapur',
    dues_balance: 1400,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const nowTime = Date.now();
const oneDayMs = 86400000;

export const INITIAL_AMC_CONTRACTS: AMCContract[] = [
  {
    id: 'amc_1',
    contract_num: 'AMC-101',
    customer_id: 'cust_1',
    customer_name: 'Anand Kulkarni',
    customer_mobile: '9890123456',
    customer_address: 'Flat 402, Shanti Heights, Lashkar, Solapur',
    appliance_name: 'Air Conditioner',
    brand_model: 'Voltas 1.5 Ton Split Inverter AC',
    duration: '1_YEAR',
    start_date: new Date(nowTime - oneDayMs * 357).toISOString().split('T')[0],
    end_date: new Date(nowTime + oneDayMs * 8).toISOString().split('T')[0],
    charge_amount: 2800,
    paid_amount: 2800,
    status: 'EXPIRING_SOON',
    notes: '2 Free dry services and 1 wet chemical wash included',
    created_at: new Date(nowTime - oneDayMs * 357).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'amc_2',
    contract_num: 'AMC-102',
    customer_id: 'cust_3',
    customer_name: 'Dr. Suresh Deshmukh',
    customer_mobile: '9422019988',
    customer_address: 'Civil Hospital Road, Solapur',
    appliance_name: 'Refrigerator',
    brand_model: 'Samsung 253L Double Door Refrigerator',
    duration: '1_YEAR',
    start_date: new Date(nowTime - oneDayMs * 120).toISOString().split('T')[0],
    end_date: new Date(nowTime + oneDayMs * 245).toISOString().split('T')[0],
    charge_amount: 1800,
    paid_amount: 1800,
    status: 'ACTIVE',
    notes: 'Covers compressor relay, thermostat check & quarterly gas leak inspection',
    created_at: new Date(nowTime - oneDayMs * 120).toISOString(),
    updated_at: new Date().toISOString()
  }
];


