import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDb } from '../../context/DbContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { ShieldCheck, UserCheck, AlertTriangle, IndianRupee, Layers, Menu } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface TopBarProps {
  activeTabTitle: string;
  onOpenMobileMenu: () => void;
  onOpenStockAlert?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTabTitle,
  onOpenMobileMenu,
  onOpenStockAlert
}) => {
  const { user, role, switchRole, isSuperAdmin } = useAuth();
  const { bills, products, customers, acknowledgedAlerts, acknowledgeStockAlerts } = useDb();
  const { t } = useLanguage();

  // Quick stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBills = bills.filter((b) => b.invoice_date === todayStr && !b.is_cancelled);
  const todayTotal = todayBills.reduce((acc, b) => acc + b.grand_total, 0);

  const unhandledLowStockItems = products.filter(
    (p) =>
      p.stock_qty <= (p.min_stock_alert !== undefined ? p.min_stock_alert : 5) &&
      !acknowledgedAlerts.includes(p.id)
  );
  const lowStockCount = unhandledLowStockItems.length;
  const totalDues = customers.reduce((acc, c) => acc + c.dues_balance, 0);

  const handleDismissAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    acknowledgeStockAlerts(unhandledLowStockItems.map((p) => p.id));
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        {/* Hamburger button on Mobile */}
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 sm:p-2 -ml-1 rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-[#0F2942]" />
        </button>

        <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-slate-800 tracking-tight truncate">
          {activeTabTitle}
        </h1>
        <span className="hidden md:inline-block text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono shrink-0">
          {t('topbar_terminal')}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick summary metric pills */}
        <div className="hidden xl:flex items-center gap-3 border-r border-slate-200 pr-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500 font-medium">{t('topbar_today')}:</span>
            <span className="font-semibold text-slate-800">{formatCurrency(todayTotal)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-slate-500 font-medium">{t('topbar_dues')}:</span>
            <span className="font-semibold text-slate-800">{formatCurrency(totalDues)}</span>
          </div>

          {/* Animated Low Stock Danger Badge (Click jumps to Notes) */}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-md p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={onOpenStockAlert}
                className="group flex items-center gap-1.5 px-2 py-0.5 text-xs text-rose-700 font-bold hover:text-rose-900 transition-all cursor-pointer"
                title="Low Stock Alert! Click to open Notes & auto-fill order"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
                <span>
                  {lowStockCount} {t('topbar_low_stock')}
                </span>
              </button>
              <button
                type="button"
                onClick={handleDismissAlert}
                className="p-1 rounded text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors"
                title="Dismiss low stock alert notification"
                aria-label="Dismiss stock alert"
              >
                <span className="text-[10px] font-bold">✕</span>
              </button>
            </div>
          )}
        </div>

        {/* English / Marathi / Hindi i18n Toggle */}
        <LanguageToggle />

        {/* User Role Switcher Dropdown */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1">
            {isSuperAdmin ? (
              <ShieldCheck className="w-4 h-4 text-blue-900" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-700" />
            )}
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[90px]">
              {user.name}
            </span>
          </div>

          <select
            value={role}
            onChange={(e) => switchRole(e.target.value as 'super_admin' | 'admin')}
            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900 cursor-pointer"
            title="Switch demo role to test Admin buy-price redaction"
          >
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </header>
  );
};
