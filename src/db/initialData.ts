import { Customer, Product, Section, Worker, ShopSettings, User } from '../types';

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
  default_conditions: '(Spare and Accessories once sold will not be taken back)\nAll Part Sold in exchange of Defective part.'
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
