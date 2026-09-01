import {
  Customer,
  Product,
  Section,
  Worker,
  ShopSettings,
  User,
  Bill,
  BillItem,
  CreditNote,
  StockMovement,
  JobStatus,
  UserRole,
  ServiceRecord,
  AppNote,
  B2BBill
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_SECTIONS,
  INITIAL_WORKERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS
} from './initialData';

const STORAGE_KEYS = {
  SETTINGS: 'starline_settings',
  USERS: 'starline_users',
  CUSTOMERS: 'starline_customers',
  SECTIONS: 'starline_sections',
  PRODUCTS: 'starline_products',
  BILLS: 'starline_bills',
  CREDIT_NOTES: 'starline_credit_notes',
  STOCK_MOVEMENTS: 'starline_stock_movements',
  WORKERS: 'starline_workers',
  ACTIVE_USER: 'starline_active_user',
  SERVICE_RECORDS: 'starline_service_records',
  APP_NOTES: 'starline_app_notes',
  B2B_BILLS: 'starline_b2b_bills',
  B2B_INVOICE_COUNTER: 'starline_b2b_invoice_counter',
  ACKNOWLEDGED_STOCK_ALERTS: 'starline_acknowledged_stock_alerts'
};

class StorageEngine {
  private get<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultVal;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  // --- INITIALIZATION ---
  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SECTIONS)) {
      this.set(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORKERS)) {
      this.set(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      this.set(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.set(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BILLS)) {
      // Seed initial sample bill matching the physical slip style
      const sampleBill: Bill = {
        id: 'bill_seed_1',
        invoice_num: '980',
        bill_type: 'ESTIMATE',
        invoice_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        customer_id: 'cust_1',
        customer_name: 'Anand Kulkarni',
        customer_mobile: '9890123456',
        customer_address: 'Flat 402, Shanti Heights, Lashkar, Solapur',
        customer_gstin: '',
        product_name_desc: 'Refrigerator (Single Door)',
        brand_model_no: 'Godrej 190L Edge',
        amc_start_date: '',
        amc_end_date: '',
        items: [
          {
            id: 'bitem_1',
            bill_id: 'bill_seed_1',
            sr_no: 1,
            product_id: 'prod_3',
            item_description: 'Single Door Fridge Thermostat WPF-22',
            hsn_code: '90321010',
            qty: 1,
            rate: 450,
            discount: 0,
            tax_rate: 0,
            taxable_value: 450,
            cgst_amount: 0,
            sgst_amount: 0,
            amount: 450,
            job_status: 'WORK_DONE'
          },
          {
            id: 'bitem_2',
            bill_id: 'bill_seed_1',
            sr_no: 2,
            product_id: 'prod_4',
            item_description: 'Fridge Relay + OLP Set (Universal)',
            hsn_code: '85364100',
            qty: 1,
            rate: 250,
            discount: 0,
            tax_rate: 0,
            taxable_value: 250,
            cgst_amount: 0,
            sgst_amount: 0,
            amount: 250,
            job_status: 'WORK_DONE'
          }
        ],
        subtotal: 700,
        total_discount: 0,
        taxable_value: 700,
        cgst_amount: 0,
        sgst_amount: 0,
        grand_total: 700,
        words_amount: 'Rupees Seven Hundred Only',
        condition_apply: '(Spare and Accessories once sold will not be taken back)\nAll Part Sold in exchange of Defective part.',
        assigned_worker_id: 'wrk_2',
        assigned_worker_name: 'Mohsin Khan',
        payment_status: 'PARTIAL',
        paid_amount: 250,
        due_amount: 450,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      };
      this.set(STORAGE_KEYS.BILLS, [sampleBill]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CREDIT_NOTES)) {
      this.set(STORAGE_KEYS.CREDIT_NOTES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS)) {
      this.set(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)) {
      this.set(STORAGE_KEYS.ACTIVE_USER, INITIAL_USERS[0]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICE_RECORDS)) {
      this.set(STORAGE_KEYS.SERVICE_RECORDS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.APP_NOTES)) {
      this.set(STORAGE_KEYS.APP_NOTES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.B2B_BILLS)) {
      this.set(STORAGE_KEYS.B2B_BILLS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.B2B_INVOICE_COUNTER)) {
      this.set(STORAGE_KEYS.B2B_INVOICE_COUNTER, 1);
    }
  }

  // --- AUTH & RBAC ---
  public getActiveUser(): User {
    return this.get<User>(STORAGE_KEYS.ACTIVE_USER, INITIAL_USERS[0]);
  }

  public setActiveUser(user: User): void {
    this.set(STORAGE_KEYS.ACTIVE_USER, user);
  }

  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  // --- SETTINGS ---
  public getSettings(): ShopSettings {
    const raw = this.get<ShopSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    return {
      ...INITIAL_SETTINGS,
      ...raw,
      dealers: Array.isArray(raw?.dealers) ? raw.dealers : (INITIAL_SETTINGS.dealers || [])
    };
  }

  public saveSettings(settings: ShopSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // --- CUSTOMERS & CRM ---
  public getCustomers(): Customer[] {
    return this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  }

  public findCustomerByPhoneOrName(query: string): Customer[] {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const customers = this.getCustomers();
    return customers.filter(
      c => c.mobile.includes(q) || c.name.toLowerCase().includes(q)
    );
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  public saveCustomer(customer: Customer): Customer {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(c => c.id === customer.id);
    if (existingIndex >= 0) {
      customers[existingIndex] = { ...customer, updated_at: new Date().toISOString() };
    } else {
      customers.push(customer);
    }
    this.set(STORAGE_KEYS.CUSTOMERS, customers);
    return customer;
  }

  public updateCustomerDues(customerId: string, amountDiff: number): void {
    const customers = this.getCustomers();
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      cust.dues_balance = Math.max(0, Math.round((cust.dues_balance + amountDiff) * 100) / 100);
      cust.updated_at = new Date().toISOString();
      this.set(STORAGE_KEYS.CUSTOMERS, customers);
    }
  }

  // --- SECTIONS / RACKS ---
  public getSections(): Section[] {
    return this.get<Section[]>(STORAGE_KEYS.SECTIONS, []);
  }

  public saveSection(section: Section): void {
    const sections = this.getSections();
    const idx = sections.findIndex(s => s.id === section.id);
    if (idx >= 0) {
      sections[idx] = section;
    } else {
      sections.push(section);
    }
    this.set(STORAGE_KEYS.SECTIONS, sections);
  }

  public deleteSection(id: string): void {
    const sections = this.getSections().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.SECTIONS, sections);
  }

  // --- PRODUCTS & INVENTORY ---
  public getProducts(role: UserRole = 'super_admin'): Product[] {
    const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    if (role === 'admin') {
      // Redact buy_price completely for admin role
      return products.map(p => {
        const { buy_price, ...rest } = p;
        return rest as Product;
      });
    }
    return products;
  }

  public findProducts(query: string, role: UserRole = 'super_admin'): Product[] {
    const products = this.getProducts(role);
    if (!query || query.trim() === '') return products.slice(0, 10);
    const q = query.toLowerCase().trim();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.hsn_code && p.hsn_code.includes(q))
    );
  }

  public getProductById(id: string, role: UserRole = 'super_admin'): Product | undefined {
    return this.getProducts(role).find(p => p.id === id);
  }

  public saveProduct(product: Product): Product {
    const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const idx = products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      // Preserve buy_price if current edit was by admin who didn't supply buy_price
      const current = products[idx];
      products[idx] = {
        ...product,
        buy_price: product.buy_price !== undefined ? product.buy_price : current.buy_price,
        updated_at: new Date().toISOString()
      };
    } else {
      products.push(product);
    }
    this.set(STORAGE_KEYS.PRODUCTS, products);
    return product;
  }

  public deleteProduct(id: string): void {
    const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []).filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PRODUCTS, products);
  }

  public combineStock(productId: string, addQty: number, notes?: string): void {
    const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const p = products.find(prod => prod.id === productId);
    if (p) {
      p.stock_qty += addQty;
      p.updated_at = new Date().toISOString();
      this.set(STORAGE_KEYS.PRODUCTS, products);

      // Audit movement
      this.recordStockMovement({
        id: 'sm_' + Date.now(),
        product_id: p.id,
        product_name: p.name,
        change_qty: addQty,
        new_balance: p.stock_qty,
        type: 'COMBINE',
        notes: notes || 'Stock combined batch merge',
        created_at: new Date().toISOString()
      });
    }
  }

  // --- STOCK MOVEMENTS ---
  public getStockMovements(): StockMovement[] {
    return this.get<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
  }

  public recordStockMovement(movement: StockMovement): void {
    const movements = this.getStockMovements();
    movements.unshift(movement);
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, movements.slice(0, 500));
  }

  // --- WORKERS ---
  public getWorkers(): Worker[] {
    return this.get<Worker[]>(STORAGE_KEYS.WORKERS, []);
  }

  public saveWorker(worker: Worker): void {
    const workers = this.getWorkers();
    const idx = workers.findIndex(w => w.id === worker.id);
    if (idx >= 0) {
      workers[idx] = worker;
    } else {
      workers.push(worker);
    }
    this.set(STORAGE_KEYS.WORKERS, workers);
  }

  // --- BILLS & TRANSACTIONAL CREATION ---
  public getBills(): Bill[] {
    return this.get<Bill[]>(STORAGE_KEYS.BILLS, []);
  }

  public getBillById(id: string): Bill | undefined {
    return this.getBills().find(b => b.id === id);
  }

  /**
   * ATOMIC BILL TRANSACTION
   * 1. Create or link customer
   * 2. Auto-create new products if typed on-the-fly
   * 3. Decrement inventory and record stock movements
   * 4. Update customer dues
   * 5. Save Bill & Items
   * 6. Increment invoice counter
   */
  public createBillTransaction(billData: Omit<Bill, 'id' | 'created_at'>): Bill {
    const now = new Date().toISOString();
    const billId = 'bill_' + Date.now();

    // 1. Handle Customer deduplication & save
    let customerId = billData.customer_id;
    const customers = this.getCustomers();

    if (billData.customer_mobile && billData.customer_mobile.trim()) {
      const match = customers.find(c => c.mobile.trim() === billData.customer_mobile.trim());
      if (match) {
        customerId = match.id;
        // Update details if changed
        match.name = billData.customer_name || match.name;
        match.address = billData.customer_address || match.address;
        if (billData.customer_gstin) match.gstin = billData.customer_gstin;
        this.saveCustomer(match);
      } else if (billData.customer_name && billData.customer_name.trim()) {
        const newCust: Customer = {
          id: 'cust_' + Date.now(),
          name: billData.customer_name.trim(),
          mobile: billData.customer_mobile.trim(),
          address: billData.customer_address || '',
          gstin: billData.customer_gstin || '',
          state_code: '27',
          dues_balance: 0,
          created_at: now,
          updated_at: now
        };
        this.saveCustomer(newCust);
        customerId = newCust.id;
      }
    }

    // 2. Process Items & Inventory
    const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const processedItems: BillItem[] = billData.items.map((item, idx) => {
      const itemId = 'bitem_' + Date.now() + '_' + idx;
      let prodId = item.product_id;

      // Find or auto-create product by description if on-the-fly
      if (!prodId && item.item_description && item.item_description.trim()) {
        const descTrim = item.item_description.trim().toLowerCase();
        const existingProd = products.find(p => p.name.toLowerCase() === descTrim);
        if (existingProd) {
          prodId = existingProd.id;
        } else {
          // On-the-fly creation
          const newProd: Product = {
            id: 'prod_' + Date.now() + '_' + idx,
            name: item.item_description.trim(),
            unit: 'NOS',
            hsn_code: item.hsn_code || '84159000',
            selling_price: item.rate || item.amount,
            stock_qty: 0,
            created_at: now,
            updated_at: now
          };
          products.push(newProd);
          prodId = newProd.id;
        }
      }

      // Decrement stock if product exists
      if (prodId) {
        const targetProd = products.find(p => p.id === prodId);
        if (targetProd) {
          targetProd.stock_qty -= item.qty;
          targetProd.updated_at = now;
          this.recordStockMovement({
            id: 'sm_' + Date.now() + '_' + idx,
            product_id: targetProd.id,
            product_name: targetProd.name,
            change_qty: -item.qty,
            new_balance: targetProd.stock_qty,
            type: 'SALE',
            reference_id: billData.invoice_num,
            notes: `Sale on Bill #${billData.invoice_num}`,
            created_at: now
          });
        }
      }

      return {
        ...item,
        id: itemId,
        bill_id: billId,
        product_id: prodId
      };
    });

    this.set(STORAGE_KEYS.PRODUCTS, products);

    // 3. Update Customer Dues
    const unpaidAmount = Math.max(0, billData.grand_total - (billData.paid_amount || 0));
    if (customerId && unpaidAmount > 0) {
      this.updateCustomerDues(customerId, unpaidAmount);
    }

    // 4. Save Bill
    const newBill: Bill = {
      ...billData,
      id: billId,
      customer_id: customerId,
      items: processedItems,
      due_amount: unpaidAmount,
      created_at: now
    };

    const bills = this.getBills();
    bills.unshift(newBill);
    this.set(STORAGE_KEYS.BILLS, bills);

    // 5. Increment invoice sequence in settings
    const settings = this.getSettings();
    const currentNum = parseInt(billData.invoice_num, 10);
    if (!isNaN(currentNum) && currentNum >= settings.starting_invoice_num) {
      settings.starting_invoice_num = currentNum + 1;
      this.saveSettings(settings);
    }

    return newBill;
  }

  public updateBillJobStatus(billId: string, itemId: string, newStatus: JobStatus): void {
    const bills = this.getBills();
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      const item = bill.items.find(i => i.id === itemId);
      if (item) {
        item.job_status = newStatus;
        this.set(STORAGE_KEYS.BILLS, bills);
      }
    }
  }

  public cancelBill(billId: string, reason?: string): void {
    const bills = this.getBills();
    const bill = bills.find(b => b.id === billId);
    if (bill && !bill.is_cancelled) {
      bill.is_cancelled = true;

      // Revert customer dues if any unpaid
      if (bill.customer_id && bill.due_amount > 0) {
        this.updateCustomerDues(bill.customer_id, -bill.due_amount);
      }

      // Revert product inventory
      const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      bill.items.forEach((item, idx) => {
        if (item.product_id) {
          const prod = products.find(p => p.id === item.product_id);
          if (prod) {
            prod.stock_qty += item.qty;
            this.recordStockMovement({
              id: 'sm_cnl_' + Date.now() + '_' + idx,
              product_id: prod.id,
              product_name: prod.name,
              change_qty: item.qty,
              new_balance: prod.stock_qty,
              type: 'RETURN',
              reference_id: bill.invoice_num,
              notes: `Bill #${bill.invoice_num} Cancelled${reason ? ': ' + reason : ''}`,
              created_at: new Date().toISOString()
            });
          }
        }
      });
      this.set(STORAGE_KEYS.PRODUCTS, products);
      this.set(STORAGE_KEYS.BILLS, bills);
    }
  }

  // --- CREDIT NOTES ---
  public getCreditNotes(): CreditNote[] {
    return this.get<CreditNote[]>(STORAGE_KEYS.CREDIT_NOTES, []);
  }

  public createCreditNote(noteData: Omit<CreditNote, 'id' | 'created_at'>): CreditNote {
    const now = new Date().toISOString();
    const noteId = 'cn_' + Date.now();

    // 1. Replenish product inventory
    if (noteData.product_id) {
      const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const prod = products.find(p => p.id === noteData.product_id);
      if (prod) {
        prod.stock_qty += noteData.qty;
        prod.updated_at = now;
        this.set(STORAGE_KEYS.PRODUCTS, products);

        this.recordStockMovement({
          id: 'sm_cn_' + Date.now(),
          product_id: prod.id,
          product_name: prod.name,
          change_qty: noteData.qty,
          new_balance: prod.stock_qty,
          type: 'RETURN',
          reference_id: noteData.note_num,
          notes: `Credit Note #${noteData.note_num} return`,
          created_at: now
        });
      }
    }

    // 2. Reduce customer dues
    if (noteData.customer_id) {
      this.updateCustomerDues(noteData.customer_id, -noteData.total_value);
    }

    // 3. Save credit note
    const newNote: CreditNote = {
      ...noteData,
      id: noteId,
      created_at: now
    };

    const notes = this.getCreditNotes();
    notes.unshift(newNote);
    this.set(STORAGE_KEYS.CREDIT_NOTES, notes);

    // 4. Increment credit note counter
    const settings = this.getSettings();
    const num = parseInt(noteData.note_num.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num >= settings.starting_credit_note_num) {
      settings.starting_credit_note_num = num + 1;
      this.saveSettings(settings);
    }

    return newNote;
  }

  // --- SERVICE RECORDS ---
  public getServiceRecords(): ServiceRecord[] {
    return this.get<ServiceRecord[]>(STORAGE_KEYS.SERVICE_RECORDS, []);
  }

  public saveServiceRecord(record: ServiceRecord): ServiceRecord {
    const records = this.getServiceRecords();
    const idx = records.findIndex(r => r.id === record.id);
    const now = new Date().toISOString();
    if (idx >= 0) {
      records[idx] = { ...record, updated_at: now };
    } else {
      records.unshift({ ...record, created_at: now, updated_at: now });
    }
    this.set(STORAGE_KEYS.SERVICE_RECORDS, records);
    return record;
  }

  public deleteServiceRecord(id: string): void {
    const records = this.getServiceRecords().filter(r => r.id !== id);
    this.set(STORAGE_KEYS.SERVICE_RECORDS, records);
  }

  // --- APP NOTES ---
  public getAppNotes(): AppNote[] {
    return this.get<AppNote[]>(STORAGE_KEYS.APP_NOTES, []);
  }

  public saveAppNote(note: AppNote): AppNote {
    const notes = this.getAppNotes();
    const idx = notes.findIndex(n => n.id === note.id);
    const now = new Date().toISOString();
    if (idx >= 0) {
      notes[idx] = { ...note, updated_at: now };
    } else {
      notes.unshift({ ...note, created_at: now, updated_at: now });
    }
    this.set(STORAGE_KEYS.APP_NOTES, notes);
    return note;
  }

  public deleteAppNote(id: string): void {
    this.set(STORAGE_KEYS.APP_NOTES, this.getAppNotes().filter(n => n.id !== id));
  }

  // --- B2B BILLS ---
  public getB2BBills(): B2BBill[] {
    return this.get<B2BBill[]>(STORAGE_KEYS.B2B_BILLS, []);
  }

  public getNextB2BInvoiceNum(): string {
    const counter = this.get<number>(STORAGE_KEYS.B2B_INVOICE_COUNTER, 1);
    return `B2B-${String(counter).padStart(3, '0')}`;
  }

  public saveB2BBill(bill: B2BBill): B2BBill {
    // 1. Deduct stock for each line item that has a product_id or matching product name
    const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const now = new Date().toISOString();

    bill.items.forEach((item, idx) => {
      let targetProd: Product | undefined;
      if (item.product_id) {
        targetProd = products.find(p => p.id === item.product_id);
      } else if (item.product_name && item.product_name.trim()) {
        const nameTrim = item.product_name.trim().toLowerCase();
        targetProd = products.find(p => p.name.toLowerCase() === nameTrim);
      }

      if (targetProd) {
        targetProd.stock_qty -= item.qty;
        targetProd.updated_at = now;
        this.recordStockMovement({
          id: 'sm_b2b_' + Date.now() + '_' + idx,
          product_id: targetProd.id,
          product_name: targetProd.name,
          change_qty: -item.qty,
          new_balance: targetProd.stock_qty,
          type: 'SALE',
          reference_id: bill.invoice_num,
          notes: `B2B Sale: ${bill.invoice_num} to ${bill.customer_name}`,
          created_at: now
        });
      }
    });
    this.set(STORAGE_KEYS.PRODUCTS, products);

    // 2. Auto-create/link customer if mobile provided
    if (bill.customer_mobile && bill.customer_mobile.trim()) {
      const customers = this.getCustomers();
      const existing = customers.find(c => c.mobile.trim() === bill.customer_mobile.trim());
      if (!existing && bill.customer_name && bill.customer_name.trim()) {
        this.saveCustomer({
          id: 'cust_' + Date.now(),
          name: bill.customer_name.trim(),
          mobile: bill.customer_mobile.trim(),
          address: bill.customer_address || '',
          dues_balance: 0,
          created_at: now,
          updated_at: now
        });
      }
    }

    // 3. Save bill
    const bills = this.getB2BBills();
    bills.unshift(bill);
    this.set(STORAGE_KEYS.B2B_BILLS, bills);

    // 4. Increment counter
    const counter = this.get<number>(STORAGE_KEYS.B2B_INVOICE_COUNTER, 1);
    this.set(STORAGE_KEYS.B2B_INVOICE_COUNTER, counter + 1);

    return bill;
  }

  public deleteB2BBill(id: string): void {
    this.set(STORAGE_KEYS.B2B_BILLS, this.getB2BBills().filter(b => b.id !== id));
  }

  // --- STOCK ALERT ACKNOWLEDGEMENT ---
  public getAcknowledgedStockAlerts(): string[] {
    return this.get<string[]>(STORAGE_KEYS.ACKNOWLEDGED_STOCK_ALERTS, []);
  }

  public acknowledgeStockAlerts(productIds?: string[]): string[] {
    let idsToAck: string[] = [];
    if (!productIds || productIds.length === 0) {
      idsToAck = this.getProducts('super_admin')
        .filter(p => p.stock_qty <= (p.min_stock_alert !== undefined ? p.min_stock_alert : 5))
        .map(p => p.id);
    } else {
      idsToAck = productIds;
    }
    const current = this.getAcknowledgedStockAlerts();
    const updated = Array.from(new Set([...current, ...idsToAck]));
    this.set(STORAGE_KEYS.ACKNOWLEDGED_STOCK_ALERTS, updated);
    return updated;
  }

  public clearAcknowledgedStockAlerts(productId?: string): void {
    if (!productId) {
      this.set(STORAGE_KEYS.ACKNOWLEDGED_STOCK_ALERTS, []);
    } else {
      const current = this.getAcknowledgedStockAlerts().filter(id => id !== productId);
      this.set(STORAGE_KEYS.ACKNOWLEDGED_STOCK_ALERTS, current);
    }
  }

  // --- BACKUP & RESTORE ---
  public exportFullBackup(): Record<string, unknown> {
    return {
      version: '2.0',
      exported_at: new Date().toISOString(),
      settings: this.getSettings(),
      users: this.getUsers(),
      sections: this.getSections(),
      workers: this.getWorkers(),
      customers: this.getCustomers(),
      products: this.getProducts('super_admin'),
      bills: this.getBills(),
      credit_notes: this.getCreditNotes(),
      stock_movements: this.getStockMovements(),
      service_records: this.getServiceRecords(),
      app_notes: this.getAppNotes(),
      b2b_bills: this.getB2BBills()
    };
  }

  public importFullBackup(data: Record<string, unknown>): boolean {
    try {
      if (data.settings) this.set(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.users) this.set(STORAGE_KEYS.USERS, data.users);
      if (data.sections) this.set(STORAGE_KEYS.SECTIONS, data.sections);
      if (data.workers) this.set(STORAGE_KEYS.WORKERS, data.workers);
      if (data.customers) this.set(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.products) this.set(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.bills) this.set(STORAGE_KEYS.BILLS, data.bills);
      if (data.credit_notes) this.set(STORAGE_KEYS.CREDIT_NOTES, data.credit_notes);
      if (data.stock_movements) this.set(STORAGE_KEYS.STOCK_MOVEMENTS, data.stock_movements);
      if (data.service_records) this.set(STORAGE_KEYS.SERVICE_RECORDS, data.service_records);
      if (data.app_notes) this.set(STORAGE_KEYS.APP_NOTES, data.app_notes);
      if (data.b2b_bills) this.set(STORAGE_KEYS.B2B_BILLS, data.b2b_bills);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }

  public clearAndReset(): void {
    localStorage.clear();
    this.init();
  }
}

export const storage = new StorageEngine();
