import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { TopBar } from './TopBar';
import { BillingScreen } from '../billing/BillingScreen';
import { BillHistory } from '../billing/BillHistory';
import { CustomerList } from '../customers/CustomerList';
import { ProductList } from '../inventory/ProductList';
import { RackSectionView } from '../inventory/RackSectionView';
import { CreditNoteManager } from '../credit-notes/CreditNoteManager';
import { FinancialReports } from '../reports/FinancialReports';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { GstExportHub } from '../gst/GstExportHub';
import { SettingsManager } from '../settings/SettingsManager';

export const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('billing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'billing':
        return 'New Invoice / Cum Receipt';
      case 'history':
        return 'Invoice Register & Bill History';
      case 'customers':
        return 'Customer Directory & Dues Ledger';
      case 'inventory':
        return 'Inventory & Spares Catalog';
      case 'racks':
        return 'Physical Store Racks & Sections';
      case 'credit-notes':
        return 'Credit Notes & Return Vouchers';
      case 'analytics':
        return 'Business Analytics & Visual KPIs';
      case 'reports':
        return 'CA Balance Sheet & Financial Reports';
      case 'gst':
        return 'GST Filing Hub (GSTR-1 & GSTR-3B)';
      case 'settings':
        return 'Store Settings & Data Backups';
      default:
        return 'Star Line Services';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Mobile Drawer & Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopBar
          activeTabTitle={getTabTitle()}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6">
          {activeTab === 'billing' && <BillingScreen onBillCreated={() => {}} />}
          {activeTab === 'history' && <BillHistory />}
          {activeTab === 'customers' && <CustomerList />}
          {activeTab === 'inventory' && <ProductList />}
          {activeTab === 'racks' && <RackSectionView />}
          {activeTab === 'credit-notes' && <CreditNoteManager />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'reports' && <FinancialReports />}
          {activeTab === 'gst' && <GstExportHub />}
          {activeTab === 'settings' && <SettingsManager />}
        </main>
      </div>
    </div>
  );
};
