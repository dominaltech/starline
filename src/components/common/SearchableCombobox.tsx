import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Mic, Check } from 'lucide-react';

export interface ComboboxOption {
  id: string;
  label: string;
  subLabel?: string;
  badge?: string;
  badgeColor?: string;
  data?: any;
}

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSelectOption?: (option: ComboboxOption) => void;
  options: ComboboxOption[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  onVoiceClick?: () => void;
  isListening?: boolean;
  emptyMessage?: string;
  title?: string;
  autoFocus?: boolean;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  value,
  onChange,
  onSelectOption,
  options,
  placeholder = 'Type to search or click dropdown...',
  className = '',
  inputClassName = '',
  disabled = false,
  onVoiceClick,
  isListening = false,
  emptyMessage = 'No matching results.',
  title,
  autoFocus = false
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAll(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options: if showAll is true (clicked via chevron arrow), show all options; otherwise filter by value
  const filteredOptions = React.useMemo(() => {
    if (showAll || !value.trim()) {
      return options;
    }
    const q = value.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, value, showAll]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowAll(false);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (!value.trim()) {
      setShowAll(true);
    } else {
      setShowAll(false);
    }
    setIsOpen(true);
  };

  const handleInputClick = () => {
    if (!isOpen) {
      if (!value.trim()) {
        setShowAll(true);
      }
      setIsOpen(true);
    }
  };

  // When clicking the dropdown icon explicitly: show all available names/entries
  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (isOpen) {
      setIsOpen(false);
      setShowAll(false);
    } else {
      setShowAll(true); // show all entries!
      setIsOpen(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.label);
    if (onSelectOption) {
      onSelectOption(opt);
    }
    setIsOpen(false);
    setShowAll(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          title={title}
          autoFocus={autoFocus}
          className={`input-field pr-14 text-xs font-semibold ${inputClassName}`}
        />

        {/* Action icons at the end of the box */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pr-1">
          {/* Optional Voice Search Mic */}
          {onVoiceClick && (
            <button
              type="button"
              onClick={onVoiceClick}
              className={`p-1 rounded text-slate-400 hover:text-blue-900 transition-colors ${
                isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : ''
              }`}
              title="Voice Search"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Chevron Dropdown Toggle Icon */}
          <button
            type="button"
            onClick={handleToggleDropdown}
            disabled={disabled}
            className="p-1 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded transition-all cursor-pointer"
            title={isOpen ? 'Close list' : 'Click to show all entries'}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-900' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl divide-y divide-slate-100 max-h-56 overflow-y-auto ring-1 ring-black/10 animate-fadeIn">
          {/* Header indicator when showing all options */}
          <div className="px-2.5 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 flex justify-between items-center border-b border-slate-200">
            <span>{showAll ? `All Entries (${options.length})` : `Matches (${filteredOptions.length})`}</span>
            {showAll ? (
              <span className="text-blue-800 font-normal">Showing entire list</span>
            ) : (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowAll(true);
                }}
                className="text-blue-900 hover:underline cursor-pointer"
              >
                View all ({options.length})
              </button>
            )}
          </div>

          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 italic">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.label.toLowerCase() === value.toLowerCase();

              return (
                <div
                  key={opt.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  className={`px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs transition-colors group ${
                    isSelected ? 'bg-blue-50/70 font-bold' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-slate-900 group-hover:text-blue-950 truncate">
                        {opt.label}
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                    </div>
                    {opt.subLabel && (
                      <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                        {opt.subLabel}
                      </div>
                    )}
                  </div>

                  {opt.badge && (
                    <span
                      className={`text-[10.5px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        opt.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
