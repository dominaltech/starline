import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { TopBar } from './TopBar';
import { useLanguage } from '../../context/LanguageContext';
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
  const { t } = useLanguage();

  const getTabTitle = () => {
    switch (activeTab) {
      case 'billing':
        return t('nav_new_invoice');
      case 'history':
        return t('nav_bill_history');
      case 'customers':
        return t('nav_customers');
      case 'inventory':
        return t('nav_products');
      case 'racks':
        return t('nav_racks');
      case 'credit-notes':
        return t('nav_credit_notes');
      case 'analytics':
        return t('nav_analytics');
      case 'reports':
        return t('nav_reports');
      case 'gst':
        return t('nav_gst');
      case 'settings':
        return t('nav_settings');
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
