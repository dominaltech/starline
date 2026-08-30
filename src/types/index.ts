export type UserRole = 'super_admin' | 'admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  gstin?: string;
  state_code?: string;
  dues_balance: number;
  follow_up_date?: string;
  follow_up_notes?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  name: string; // e.g. "Rack A1", "Shelf 2"
  description?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  hsn_code?: string;
  unit: string; // 'PCS' | 'NOS' | 'QTL' | 'SET' | 'MTR'
  buy_price?: number; // Only visible to Super Admin
  selling_price: number;
  image_data?: string;
  stock_qty: number;
  section_id?: string;
  min_stock_alert?: number;
  created_at: string;
  updated_at: string;
}

export type StockMovementType = 'PURCHASE' | 'SALE' | 'RETURN' | 'COMBINE' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  change_qty: number; // positive or negative
  new_balance: number;
  type: StockMovementType;
  reference_id?: string; // Bill ID, Credit Note ID, etc.
  notes?: string;
  created_at: string;
}

export type BillType = 'ESTIMATE' | 'GST';
export type JobStatus = 'WORK_DONE' | 'IN_PROGRESS' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface BillItem {
  id: string;
  bill_id: string;
  sr_no: number;
  product_id?: string;
  item_description: string;
  hsn_code?: string;
  qty: number;
  rate: number; // Rate per unit (GST mode)
  discount: number; // Percentage or fixed discount
  tax_rate: number; // e.g. 18 (9% CGST + 9% SGST)
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  amount: number; // Total row amount
  job_status: JobStatus;
}

export interface Bill {
  id: string;
  invoice_num: string; // e.g. "980", "981" or "SL/981"
  bill_type: BillType;
  invoice_date: string; // YYYY-MM-DD
  customer_id?: string;
  customer_name: string;
  customer_mobile: string;
  customer_address: string;
  customer_gstin?: string;
  product_name_desc: string; // Appliance name: "Refrigerator"
  brand_model_no: string; // "LG 190L"
  amc_start_date?: string;
  amc_end_date?: string;
  items: BillItem[];
  subtotal: number;
  total_discount: number;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  grand_total: number;
  words_amount: string;
  condition_apply: string;
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  payment_status: PaymentStatus;
  paid_amount: number;
  due_amount: number;
  is_cancelled?: boolean;
  created_at: string;
}

export interface CreditNote {
  id: string;
  note_num: string; // e.g. "CN-101"
  note_date: string;
  original_bill_id: string;
  original_invoice_num: string;
  customer_id?: string;
  customer_name: string;
  customer_gstin?: string;
  note_type: 'C' | 'D'; // C = Credit Note
  reason: string;
  product_id?: string;
  item_description: string;
  qty: number;
  tax_rate: number;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  total_value: number;
  created_at: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  specialization?: string;
  is_active: boolean;
  created_at: string;
}

export interface ShopSettings {
  shop_name: string;
  tagline: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state_code: string; // "27"
  state_name: string; // "Maharashtra"
  pincode: string;
  mobiles: string;
  gstin: string;
  starting_invoice_num: number;
  starting_credit_note_num: number;
  default_cgst_rate: number;
  default_sgst_rate: number;
  default_conditions: string;
  dealers: DealerContact[];
}

export interface DealerContact {
  id: string;
  name: string;
  phone: string;
  specialization?: string;
  is_active: boolean;
  created_at: string;
}

export type ServiceStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export interface ServiceRecord {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_mobile: string;
  service_name: string;
  service_description?: string;
  price: number;
  service_date: string; // YYYY-MM-DD
  status: ServiceStatus;
  notes?: string;
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  whatsapp_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppNote {
  id: string;
  title: string;
  content: string;
  product_refs: string[];
  note_type: 'GENERAL' | 'ORDER';
  created_at: string;
  updated_at: string;
}

export interface B2BBillItem {
  id: string;
  product_id?: string;
  product_name: string;
  qty: number;
  price: number;
  total: number;
  image_data?: string;
}

export type B2BPaymentMethod = 'Cash' | 'PhonePe' | 'GPay' | 'Bank Transfer' | 'Credit';

export interface B2BBill {
  id: string;
  invoice_num: string; // e.g. "B2B-001"
  bill_date: string; // YYYY-MM-DD
  mechanic_name: string;
  customer_name: string;
  customer_mobile: string;
  customer_address?: string;
  items: B2BBillItem[];
  total_amount: number;
  payment_method: B2BPaymentMethod;
  paid_amount: number;
  notes?: string;
  created_at: string;
}
