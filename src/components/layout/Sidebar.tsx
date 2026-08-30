import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Translations } from '../../i18n/translations';
import {
  FileText,
  Users,
  Package,
  RotateCcw,
  BarChart3,
  Building2,
  Settings,
  Star,
  Receipt,
  LayoutGrid,
  TrendingUp,
  ShoppingBag,
  Wrench,
  ClipboardList,
  Wallet,
  X
} from 'lucide-react';

export type NavTab =
  | 'billing'
  | 'b2b'
  | 'history'
  | 'customers'
  | 'udhar'
  | 'services'
  | 'notes'
  | 'inventory'
  | 'racks'
  | 'credit-notes'
  | 'analytics'
  | 'reports'
  | 'gst'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen
}) => {
  const { t } = useLanguage();

  const navItems: { id: NavTab; labelKey: keyof Translations; icon: React.FC<{ className?: string }> }[] = [
    { id: 'billing', labelKey: 'nav_new_invoice', icon: Receipt },
    { id: 'b2b', labelKey: 'nav_b2b', icon: ShoppingBag },
    { id: 'history', labelKey: 'nav_bill_history', icon: FileText },
    { id: 'customers', labelKey: 'nav_customers', icon: Users },
    { id: 'udhar', labelKey: 'nav_udhar', icon: Wallet },
    { id: 'services', labelKey: 'nav_services', icon: Wrench },
    { id: 'notes', labelKey: 'nav_notes', icon: ClipboardList },
    { id: 'inventory', labelKey: 'nav_products', icon: Package },
    { id: 'racks', labelKey: 'nav_racks', icon: LayoutGrid },
    { id: 'credit-notes', labelKey: 'nav_credit_notes', icon: RotateCcw },
    { id: 'analytics', labelKey: 'nav_analytics', icon: TrendingUp },
    { id: 'reports', labelKey: 'nav_reports', icon: BarChart3 },
    { id: 'gst', labelKey: 'nav_gst', icon: Building2 },
    { id: 'settings', labelKey: 'nav_settings', icon: Settings },
  ];

  const handleSelectTab = (tabId: NavTab) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Star className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-tight text-red-600 font-sans">
                  STAR LINE SERVICES
                </div>
                <div className="text-[11px] text-slate-500 font-medium leading-tight">
                  Solapur Billing & CRM
                </div>
              </div>
            </div>

            {/* Close Button on Mobile Drawer */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 lg:hidden"
              aria-label="Close Navigation Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#0F2942] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 bg-slate-50/30">
          <div className="font-semibold text-slate-700">Offline Local DB Active</div>
          <div className="text-[11px] text-slate-400 mt-0.5">GST 1 & 3B Ready • V1.0</div>
        </div>
      </aside>
    </>
  );
};
