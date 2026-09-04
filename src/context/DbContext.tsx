import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Customer,
  Product,
  Section,
  Worker,
  Mechanic,
  ShopSettings,
  Bill,
  CreditNote,
  StockMovement,
  JobStatus,
  ServiceRecord,
  AppNote,
  B2BBill
} from '../types';
import { storage } from '../db/storage';
import { useAuth } from './AuthContext';

interface DbContextType {
  settings: ShopSettings;
  customers: Customer[];
  products: Product[];
  sections: Section[];
  workers: Worker[];
  mechanics: Mechanic[];
  bills: Bill[];
  creditNotes: CreditNote[];
  stockMovements: StockMovement[];
  serviceRecords: ServiceRecord[];
  appNotes: AppNote[];
  b2bBills: B2BBill[];
  acknowledgedAlerts: string[];
  acknowledgeStockAlerts: (productIds?: string[]) => void;
  resetStockAlerts: (productId?: string) => void;
  refreshData: () => void;
  saveSettings: (s: ShopSettings) => void;
  createBill: (b: Omit<Bill, 'id' | 'created_at'>) => Bill;
  updateBillJobStatus: (billId: string, itemId: string, newStatus: JobStatus) => void;
  cancelBill: (billId: string, reason?: string) => void;
  saveCustomer: (c: Customer) => Customer;
  saveProduct: (p: Product) => Product;
  deleteProduct: (id: string) => void;
  combineStock: (id: string, qty: number, notes?: string) => void;
  saveSection: (s: Section) => void;
  deleteSection: (id: string) => void;
  saveWorker: (w: Worker) => void;
  saveMechanic: (m: Mechanic) => Mechanic;
  deleteMechanic: (id: string) => void;
  createCreditNote: (cn: Omit<CreditNote, 'id' | 'created_at'>) => CreditNote;
  saveServiceRecord: (r: ServiceRecord) => ServiceRecord;
  deleteServiceRecord: (id: string) => void;
  saveAppNote: (n: AppNote) => AppNote;
  deleteAppNote: (id: string) => void;
  saveB2BBill: (b: B2BBill) => B2BBill;
  deleteB2BBill: (id: string) => void;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const [settings, setSettings] = useState<ShopSettings>(() => storage.getSettings());
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts(role));
  const [sections, setSections] = useState<Section[]>(() => storage.getSections());
  const [workers, setWorkers] = useState<Worker[]>(() => storage.getWorkers());
  const [mechanics, setMechanics] = useState<Mechanic[]>(() => storage.getMechanics());
  const [bills, setBills] = useState<Bill[]>(() => storage.getBills());
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => storage.getCreditNotes());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => storage.getStockMovements());
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(() => storage.getServiceRecords());
  const [appNotes, setAppNotes] = useState<AppNote[]>(() => storage.getAppNotes());
  const [b2bBills, setB2BBills] = useState<B2BBill[]>(() => storage.getB2BBills());
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>(() =>
    storage.getAcknowledgedStockAlerts()
  );

  const refreshData = useCallback(() => {
    setSettings(storage.getSettings());
    setCustomers(storage.getCustomers());
    setProducts(storage.getProducts(role));
    setSections(storage.getSections());
    setWorkers(storage.getWorkers());
    setMechanics(storage.getMechanics());
    setBills(storage.getBills());
    setCreditNotes(storage.getCreditNotes());
    setStockMovements(storage.getStockMovements());
    setServiceRecords(storage.getServiceRecords());
    setAppNotes(storage.getAppNotes());
    setB2BBills(storage.getB2BBills());
    setAcknowledgedAlerts(storage.getAcknowledgedStockAlerts());
  }, [role]);


  const handleAcknowledgeStockAlerts = (productIds?: string[]) => {
    const updated = storage.acknowledgeStockAlerts(productIds);
    setAcknowledgedAlerts(updated);
  };

  const handleResetStockAlerts = (productId?: string) => {
    storage.clearAcknowledgedStockAlerts(productId);
    setAcknowledgedAlerts(storage.getAcknowledgedStockAlerts());
  };

  useEffect(() => {
    refreshData();
  }, [refreshData, role]);

  const handleSaveSettings = (newSettings: ShopSettings) => {
    storage.saveSettings(newSettings);
    refreshData();
  };

  const handleCreateBill = (billData: Omit<Bill, 'id' | 'created_at'>): Bill => {
    const created = storage.createBillTransaction(billData);
    refreshData();
    return created;
  };

  const handleUpdateJobStatus = (billId: string, itemId: string, status: JobStatus) => {
    storage.updateBillJobStatus(billId, itemId, status);
    refreshData();
  };

  const handleCancelBill = (billId: string, reason?: string) => {
    storage.cancelBill(billId, reason);
    refreshData();
  };

  const handleSaveCustomer = (c: Customer) => {
    const res = storage.saveCustomer(c);
    refreshData();
    return res;
  };

  const handleSaveProduct = (p: Product) => {
    const res = storage.saveProduct(p);
    refreshData();
    return res;
  };

  const handleDeleteProduct = (id: string) => {
    storage.deleteProduct(id);
    refreshData();
  };

  const handleCombineStock = (id: string, qty: number, notes?: string) => {
    storage.combineStock(id, qty, notes);
    refreshData();
  };

  const handleSaveSection = (s: Section) => {
    storage.saveSection(s);
    refreshData();
  };

  const handleDeleteSection = (id: string) => {
    storage.deleteSection(id);
    refreshData();
  };

  const handleSaveWorker = (w: Worker) => {
    storage.saveWorker(w);
    refreshData();
  };

  const handleCreateCreditNote = (cn: Omit<CreditNote, 'id' | 'created_at'>) => {
    const res = storage.createCreditNote(cn);
    refreshData();
    return res;
  };

  const handleSaveServiceRecord = (r: ServiceRecord) => {
    const res = storage.saveServiceRecord(r);
    refreshData();
    return res;
  };

  const handleDeleteServiceRecord = (id: string) => {
    storage.deleteServiceRecord(id);
    refreshData();
  };

  const handleSaveMechanic = (m: Mechanic) => {
    const res = storage.saveMechanic(m);
    refreshData();
    return res;
  };

  const handleDeleteMechanic = (id: string) => {
    storage.deleteMechanic(id);
    refreshData();
  };

  const handleSaveAppNote = (n: AppNote) => {
    const res = storage.saveAppNote(n);
    refreshData();
    return res;
  };

  const handleDeleteAppNote = (id: string) => {
    storage.deleteAppNote(id);
    refreshData();
  };

  const handleSaveB2BBill = (b: B2BBill) => {
    const res = storage.saveB2BBill(b);
    refreshData();
    return res;
  };

  const handleDeleteB2BBill = (id: string) => {
    storage.deleteB2BBill(id);
    refreshData();
  };

  const value: DbContextType = {
    settings,
    customers,
    products,
    sections,
    workers,
    mechanics,
    bills,
    creditNotes,
    stockMovements,
    serviceRecords,
    appNotes,
    b2bBills,
    acknowledgedAlerts,
    acknowledgeStockAlerts: handleAcknowledgeStockAlerts,
    resetStockAlerts: handleResetStockAlerts,
    refreshData,
    saveSettings: handleSaveSettings,
    createBill: handleCreateBill,
    updateBillJobStatus: handleUpdateJobStatus,
    cancelBill: handleCancelBill,
    saveCustomer: handleSaveCustomer,
    saveProduct: handleSaveProduct,
    deleteProduct: handleDeleteProduct,
    combineStock: handleCombineStock,
    saveSection: handleSaveSection,
    deleteSection: handleDeleteSection,
    saveWorker: handleSaveWorker,
    saveMechanic: handleSaveMechanic,
    deleteMechanic: handleDeleteMechanic,
    createCreditNote: handleCreateCreditNote,
    saveServiceRecord: handleSaveServiceRecord,
    deleteServiceRecord: handleDeleteServiceRecord,
    saveAppNote: handleSaveAppNote,
    deleteAppNote: handleDeleteAppNote,
    saveB2BBill: handleSaveB2BBill,
    deleteB2BBill: handleDeleteB2BBill
  };

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
};

export const useDb = (): DbContextType => {
  const context = useContext(DbContext);
  if (!context) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
};
