import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { TopBar } from './TopBar';
import { useLanguage } from '../../context/LanguageContext';
import { useDb } from '../../context/DbContext';
import { BillingScreen } from '../billing/BillingScreen';
import { B2BBillingScreen } from '../b2b/B2BBillingScreen';
import { BillHistory } from '../billing/BillHistory';
import { CustomerList } from '../customers/CustomerList';
import { UdharKhataManager } from '../udhar/UdharKhataManager';
import { ServicesManager } from '../services/ServicesManager';
import { NotesManager } from '../notes/NotesManager';
import { ProductList } from '../inventory/ProductList';
import { RackSectionView } from '../inventory/RackSectionView';
import { CreditNoteManager } from '../credit-notes/CreditNoteManager';
import { FinancialReports } from '../reports/FinancialReports';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { GstExportHub } from '../gst/GstExportHub';
import { SettingsManager } from '../settings/SettingsManager';
import { formatDate } from '../../utils/formatters';

export const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('billing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [prefilledNoteContent, setPrefilledNoteContent] = useState<string>('');

  const { t } = useLanguage();
  const { products } = useDb();

  const handleStockAlertClick = () => {
    // 1. Identify low stock items (or lowest stock items if none below alert)
    let itemsToOrder = products.filter(
      (p) => p.stock_qty <= (p.min_stock_alert !== undefined ? p.min_stock_alert : 5)
    );
    if (itemsToOrder.length === 0) {
      itemsToOrder = [...products].sort((a, b) => a.stock_qty - b.stock_qty).slice(0, 3);
    }

    const todayDate = formatDate(new Date().toISOString());
    let totalEstimatedValue = 0;

    const itemsText = itemsToOrder
      .map((p, idx) => {
        const minAlert = p.min_stock_alert || 5;
        const reorderQty = Math.max(5, minAlert * 2 - p.stock_qty);
        const estPrice = p.buy_price || p.selling_price || 0;
        const lineTotal = reorderQty * estPrice;
        totalEstimatedValue += lineTotal;

        return (
          `${idx + 1}. ${p.name}${p.sku ? ` [SKU: ${p.sku}]` : ''}\n` +
          `   • Current Stock: ${p.stock_qty} ${p.unit} (Min Threshold: ${minAlert} ${p.unit})\n` +
          `   • Reorder Qty: ${reorderQty} ${p.unit} | Approx Rate: ₹${estPrice}\n` +
          `   • Line Total: ₹${lineTotal.toFixed(2)}`
        );
      })
      .join('\n\n');

    const formattedOrder =
      `======================================================\n` +
      `STAR LINE SERVICES — LOW STOCK PURCHASE ORDER\n` +
      `Date: ${todayDate} | Status: Order Prepared for Supplier\n` +
      `======================================================\n\n` +
      `ITEMS TO REORDER:\n\n` +
      `${itemsText}\n\n` +
      `------------------------------------------------------\n` +
      `Total Line Items: ${itemsToOrder.length}\n` +
      `Estimated Order Value: ₹${totalEstimatedValue.toFixed(2)}\n` +
      `Required Dispatch: Earliest express delivery requested.\n` +
      `======================================================`;

    setPrefilledNoteContent(formattedOrder);
    setActiveTab('notes');
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'billing':
        return t('nav_new_invoice');
      case 'b2b':
        return t('nav_b2b');
      case 'history':
        return t('nav_bill_history');
      case 'customers':
        return t('nav_customers');
      case 'udhar':
        return t('nav_udhar');
      case 'services':
        return t('nav_services');
      case 'notes':
        return t('nav_notes');
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
          onOpenStockAlert={handleStockAlertClick}
        />

        <main className="flex-1 p-3 sm:p-6">
          {activeTab === 'billing' && <BillingScreen onBillCreated={() => {}} />}
          {activeTab === 'b2b' && <B2BBillingScreen />}
          {activeTab === 'history' && <BillHistory />}
          {activeTab === 'customers' && <CustomerList />}
          {activeTab === 'udhar' && <UdharKhataManager />}
          {activeTab === 'services' && <ServicesManager />}
          {activeTab === 'notes' && (
            <NotesManager
              initialContent={prefilledNoteContent}
              onClearInitialContent={() => setPrefilledNoteContent('')}
            />
          )}
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
