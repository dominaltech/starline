import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Customer,
  Product,
  Section,
  Worker,
  ShopSettings,
  Bill,
  CreditNote,
  StockMovement,
  JobStatus
} from '../types';
import { storage } from '../db/storage';
import { useAuth } from './AuthContext';

interface DbContextType {
  settings: ShopSettings;
  customers: Customer[];
  products: Product[];
  sections: Section[];
  workers: Worker[];
  bills: Bill[];
  creditNotes: CreditNote[];
  stockMovements: StockMovement[];
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
  createCreditNote: (cn: Omit<CreditNote, 'id' | 'created_at'>) => CreditNote;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const [settings, setSettings] = useState<ShopSettings>(() => storage.getSettings());
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts(role));
  const [sections, setSections] = useState<Section[]>(() => storage.getSections());
  const [workers, setWorkers] = useState<Worker[]>(() => storage.getWorkers());
  const [bills, setBills] = useState<Bill[]>(() => storage.getBills());
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => storage.getCreditNotes());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => storage.getStockMovements());

  const refreshData = useCallback(() => {
    setSettings(storage.getSettings());
    setCustomers(storage.getCustomers());
    setProducts(storage.getProducts(role));
    setSections(storage.getSections());
    setWorkers(storage.getWorkers());
    setBills(storage.getBills());
    setCreditNotes(storage.getCreditNotes());
    setStockMovements(storage.getStockMovements());
  }, [role]);

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

  const value: DbContextType = {
    settings,
    customers,
    products,
    sections,
    workers,
    bills,
    creditNotes,
    stockMovements,
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
    createCreditNote: handleCreateCreditNote
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
