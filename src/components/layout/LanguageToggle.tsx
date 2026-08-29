import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../i18n/translations';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string; short: string }[] = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'mr', label: 'मराठी', short: 'मराठी' },
    { code: 'hi', label: 'हिंदी', short: 'हिंदी' }
  ];

  return (
    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
      <div className="flex items-center px-1.5 text-slate-400">
        <Globe className="w-3.5 h-3.5 text-blue-900" />
      </div>
      {options.map((opt) => {
        const isActive = language === opt.code;
        return (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            title={`Switch to ${opt.label}`}
            className={`px-2.5 py-1 rounded-md transition-all text-xs font-bold ${
              isActive
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.short}</span>
          </button>
        );
      })}
    </div>
  );
};
