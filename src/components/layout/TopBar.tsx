import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDb } from '../../context/DbContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import {
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  IndianRupee,
  Layers,
  Menu,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  X
} from 'lucide-react';
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
  const { user, role, switchRole, verifyAndSwitchToSuperAdmin, isSuperAdmin } = useAuth();
  const { bills, products, customers, acknowledgedAlerts, acknowledgeStockAlerts } = useDb();
  const { t } = useLanguage();

  // Super Admin Password Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

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

  const handleRoleChange = (newRole: 'super_admin' | 'admin') => {
    if (newRole === 'super_admin') {
      setPasswordInput('');
      setPasswordError('');
      setShowPassword(false);
      setIsPasswordModalOpen(true);
    } else {
      switchRole('admin');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError('Please enter the Super Admin password.');
      return;
    }

    const success = verifyAndSwitchToSuperAdmin(passwordInput);
    if (success) {
      setIsPasswordModalOpen(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password! Access denied.');
    }
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
            onChange={(e) => handleRoleChange(e.target.value as 'super_admin' | 'admin')}
            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900 cursor-pointer"
            title="Switch User Role"
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Super Admin Password Verification Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Super Admin Access</h3>
                  <p className="text-[11px] text-slate-500">Security password required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Super Admin Password:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter password..."
                    className="input-field pr-9 text-xs font-mono py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError ? (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {passwordError}
                  </p>
                ) : (
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Default password is <code className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">123456</code> (manageable in Settings).
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-1.5 bg-[#0F2942] hover:bg-[#1e3a5f] text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verify &amp; Unlock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
