import React from 'react';
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
  TrendingUp
} from 'lucide-react';

export type NavTab = 'billing' | 'history' | 'customers' | 'inventory' | 'racks' | 'credit-notes' | 'analytics' | 'reports' | 'gst' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'billing', label: 'New Invoice', icon: Receipt, section: 'Billing' },
    { id: 'history', label: 'Bill History', icon: FileText, section: 'Billing' },
    { id: 'customers', label: 'Customers & CRM', icon: Users, section: 'Management' },
    { id: 'inventory', label: 'Products & Stock', icon: Package, section: 'Management' },
    { id: 'racks', label: 'Physical Racks', icon: LayoutGrid, section: 'Management' },
    { id: 'credit-notes', label: 'Credit Notes', icon: RotateCcw, section: 'Management' },
    { id: 'analytics', label: 'Analytics & Insights', icon: TrendingUp, section: 'Finance' },
    { id: 'reports', label: 'CA Reports / P&L', icon: BarChart3, section: 'Finance' },
    { id: 'gst', label: 'GST Filing Hub', icon: Building2, section: 'Finance' },
    { id: 'settings', label: 'Settings & Backups', icon: Settings, section: 'System' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header matching physical bill identity */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
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
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
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
  );
};
