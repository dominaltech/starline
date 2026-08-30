import React, { useState, useEffect } from 'react';
import { useDb } from '../../context/DbContext';
import { AppNote, Product } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  ClipboardList,
  Plus,
  Trash2,
  Save,
  MessageCircle,
  Search,
  Package,
  Truck,
  Globe,
  X,
  FileText,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface NotesManagerProps {
  initialContent?: string;
  onClearInitialContent?: () => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({
  initialContent,
  onClearInitialContent
}) => {
  const { appNotes, products, settings, saveAppNote, deleteAppNote } = useDb();

  const [notesSearch, setNotesSearch] = useState<string>('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Active Note Editor State
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [noteType, setNoteType] = useState<'GENERAL' | 'ORDER'>('GENERAL');
  const [productRefs, setProductRefs] = useState<string[]>([]);

  // Product Search for Quick Insertion
  const [partSearchQuery, setPartSearchQuery] = useState<string>('');
  const [partSearchResults, setPartSearchResults] = useState<Product[]>([]);

  // Send to Dealer WhatsApp Modal
  const [showDealerModal, setShowDealerModal] = useState<boolean>(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string>('');
  const [dealerMsgLang, setDealerMsgLang] = useState<'mr' | 'hi' | 'en'>('mr');

  // If initialContent provided (from Low Stock Alert click), auto-create new Order Note
  useEffect(() => {
    if (initialContent && initialContent.trim().length > 0) {
      const newId = 'note_' + Date.now();
      const newNote: AppNote = {
        id: newId,
        title: `Low Stock Spares Order — ${formatDate(new Date().toISOString())}`,
        content: `*URGENT PURCHASE ORDER — LOW STOCK SPARES*\n\n${initialContent}\n\n*Required by tomorrow evening.*`,
        product_refs: [],
        note_type: 'ORDER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      saveAppNote(newNote);
      setActiveNoteId(newId);
      setTitle(newNote.title);
      setContent(newNote.content);
      setNoteType('ORDER');

      if (onClearInitialContent) onClearInitialContent();
    }
  }, [initialContent]);

  // Set initial active note if none selected
  useEffect(() => {
    if (!activeNoteId && appNotes.length > 0) {
      const first = appNotes[0];
      setActiveNoteId(first.id);
      setTitle(first.title);
      setContent(first.content);
      setNoteType(first.note_type || 'GENERAL');
      setProductRefs(first.product_refs || []);
    }
  }, [appNotes, activeNoteId]);

  // Handle Note Switching
  const handleSelectNote = (n: AppNote) => {
    setActiveNoteId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setNoteType(n.note_type || 'GENERAL');
    setProductRefs(n.product_refs || []);
  };

  // Create New Note
  const handleCreateNewNote = (type: 'GENERAL' | 'ORDER' = 'GENERAL') => {
    const newId = 'note_' + Date.now();
    const isOrder = type === 'ORDER';
    const newNote: AppNote = {
      id: newId,
      title: isOrder
        ? `Wholesale Purchase Order — ${formatDate(new Date().toISOString())}`
        : 'Untitled Note',
      content: isOrder
        ? '*PURCHASE ORDER REQUIREMENTS:*\n\n'
        : '',
      product_refs: [],
      note_type: type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveAppNote(newNote);
    setActiveNoteId(newId);
    setTitle(newNote.title);
    setContent(newNote.content);
    setNoteType(type);
    setProductRefs([]);
  };

  // Save Active Note
  const handleSaveCurrentNote = () => {
    if (!activeNoteId) return;
    const current = appNotes.find((n) => n.id === activeNoteId);
    const updated: AppNote = {
      id: activeNoteId,
      title: title.trim() || 'Untitled Note',
      content: content,
      note_type: noteType,
      product_refs: productRefs,
      created_at: current?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveAppNote(updated);
  };

  // Delete Active Note
  const handleDeleteCurrentNote = () => {
    if (!activeNoteId) return;
    const confirm = window.confirm('Are you sure you want to delete this note?');
    if (confirm) {
      deleteAppNote(activeNoteId);
      setActiveNoteId(null);
    }
  };

  // Product Search for Quick Insertion
  useEffect(() => {
    if (partSearchQuery.trim().length >= 1) {
      const q = partSearchQuery.toLowerCase().trim();
      const matches = products
        .filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)))
        .slice(0, 6);
      setPartSearchResults(matches);
    } else {
      setPartSearchResults([]);
    }
  }, [partSearchQuery, products]);

  const insertProductIntoNote = (p: Product) => {
    const formattedLine = `\n• ${p.name} (Current Stock: ${p.stock_qty} ${p.unit}) — Order Qty: [ ]`;
    setContent((prev) => prev + formattedLine);
    setProductRefs((prev) => Array.from(new Set([...prev, p.id])));
    setPartSearchQuery('');
    setPartSearchResults([]);
  };

  // WhatsApp Dealer Message Builder
  const buildDealerOrderMessage = (lang: 'mr' | 'hi' | 'en'): string => {
    const shopName = settings.shop_name;
    const date = formatDate(new Date().toISOString());

    if (lang === 'mr') {
      return (
        `*${shopName}, सोलापूर*\n` +
        `दिनांक: ${date}\n` +
        `संपर्क: ${settings.mobiles}\n\n` +
        `नमस्कार,\n` +
        `आम्हाला खालील सुटे भाग / साहित्य ऑर्डर करायचे आहे. कृपया दर व उपलब्धता कळवावी:\n` +
        `------------------------\n` +
        `${content}\n` +
        `------------------------\n` +
        `कृपया लवकरात लवकर डिलिव्हरी पाठवावी.\n\nधन्यवाद!\n*${shopName}*`
      );
    } else if (lang === 'hi') {
      return (
        `*${shopName}, सोलापुर*\n` +
        `दिनांक: ${date}\n` +
        `संपर्क: ${settings.mobiles}\n\n` +
        `नमस्ते,\n` +
        `हमें निम्नलिखित स्पेयर पार्ट्स / माल का ऑर्डर देना है। कृपया दर व उपलब्धता बताएं:\n` +
        `------------------------\n` +
        `${content}\n` +
        `------------------------\n` +
        `कृपया जल्द से जल्द डिलीवरी भेजें।\n\nधन्यवाद!\n*${shopName}*`
      );
    } else {
      return (
        `*${shopName}, Solapur*\n` +
        `Date: ${date}\n` +
        `Contact: ${settings.mobiles}\n\n` +
        `Hello,\n` +
        `We would like to place a purchase order for the following spare parts:\n` +
        `------------------------\n` +
        `${content}\n` +
        `------------------------\n` +
        `Please confirm availability and earliest dispatch.\n\nThank you!\n*${shopName}*`
      );
    }
  };

  const handleSendToDealer = () => {
    const dealer = (settings.dealers || []).find((d) => d.id === selectedDealerId);
    if (!dealer) {
      alert('Please select a wholesale dealer from the list.');
      return;
    }

    const cleanPhone = dealer.phone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(buildDealerOrderMessage(dealerMsgLang));
    const url = `https://wa.me/${phoneWithCode}?text=${msg}`;
    window.open(url, '_blank');
    setShowDealerModal(false);
  };

  // Filtered Notes List
  const filteredNotes = appNotes.filter((n) => {
    if (!notesSearch.trim()) return true;
    const q = notesSearch.toLowerCase().trim();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Notes & Dealer Purchase Order Pad</h2>
            <p className="text-xs text-slate-500">
              Custom workshop notepad, low-stock order builder, and one-click WhatsApp dispatch to suppliers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCreateNewNote('ORDER')}
            className="btn-secondary text-xs px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-bold"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>+ What to Order Pad</span>
          </button>

          <button
            onClick={() => handleCreateNewNote('GENERAL')}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Two-Column Notepad Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column: Notes List (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-lg border border-slate-200 shadow-xs p-3.5 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes..."
              value={notesSearch}
              onChange={(e) => setNotesSearch(e.target.value)}
              className="input-field pl-8 text-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                No notes found. Click &quot;New Note&quot; or &quot;What to Order Pad&quot; to begin.
              </div>
            ) : (
              filteredNotes.map((n) => {
                const isActive = n.id === activeNoteId;
                const isOrder = n.note_type === 'ORDER';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleSelectNote(n)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-blue-50/80 border-blue-900 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4
                        className={`text-xs font-bold truncate flex-1 ${
                          isActive ? 'text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        {n.title || 'Untitled Note'}
                      </h4>
                      {isOrder && (
                        <span className="text-[9.5px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded shrink-0">
                          ORDER
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-mono">
                      {n.content || '(Empty note)'}
                    </p>

                    <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(n.updated_at || n.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Note Editor (8 cols) */}
        <div className="md:col-span-8 bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          {activeNoteId ? (
            <>
              {/* Note Header & Type Selector */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveCurrentNote}
                    placeholder="Note Title..."
                    className="w-full text-base font-bold text-slate-900 focus:outline-none focus:ring-0 border-b border-transparent hover:border-slate-300 focus:border-blue-900 pb-1"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <select
                    value={noteType}
                    onChange={(e) => {
                      setNoteType(e.target.value as 'GENERAL' | 'ORDER');
                      handleSaveCurrentNote();
                    }}
                    className="text-xs font-bold border border-slate-300 rounded px-2.5 py-1 bg-white"
                  >
                    <option value="GENERAL">General Workshop Note</option>
                    <option value="ORDER">Dealer Purchase Order (What to Order)</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleDeleteCurrentNote}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Textarea Editor */}
              <div>
                <textarea
                  rows={13}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onBlur={handleSaveCurrentNote}
                  placeholder="Type your notes, workshop reminders, or parts order list here..."
                  className="input-field font-mono text-xs leading-relaxed resize-y bg-slate-50/50"
                />
              </div>

              {/* Quick Spares Insertion Search Bar */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-900" />
                    <span>Search Catalog to Auto-Insert Part into Note</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Includes current stock level
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={partSearchQuery}
                    onChange={(e) => setPartSearchQuery(e.target.value)}
                    placeholder="Type part name to search & insert (e.g. Capacitor, Relay, Thermostat)..."
                    className="input-field text-xs pl-8 font-semibold"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                {partSearchResults.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg shadow-md divide-y divide-slate-100 max-h-44 overflow-y-auto">
                    {partSearchResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => insertProductIntoNote(p)}
                        className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs group"
                      >
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-blue-900">
                            {p.name}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-2">({p.unit})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              p.stock_qty <= (p.min_stock_alert || 5)
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            Stock: {p.stock_qty}
                          </span>
                          <span className="text-blue-900 font-bold flex items-center gap-0.5 group-hover:underline">
                            <span>+ Insert</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-400 italic">
                  Changes auto-saved on click outside
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveCurrentNote}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-900" />
                    <span>Save Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDealerModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send to Dealer WhatsApp</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">Select a note or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Dealer WhatsApp Modal */}
      {showDealerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-900" />
                <span>Send Purchase Order to Wholesale Dealer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDealerModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Dealer Dropdown */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700">
                Select Wholesaler / Dealer *
              </label>
              {(settings.dealers || []).length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                  No dealers added yet. Please add supplier contacts in <strong>Settings → Wholesale Dealers</strong>.
                </div>
              ) : (
                <select
                  value={selectedDealerId}
                  onChange={(e) => setSelectedDealerId(e.target.value)}
                  className="input-field font-bold text-xs cursor-pointer"
                >
                  <option value="">-- Select Supplier / Dealer --</option>
                  {(settings.dealers || []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (+91 {d.phone}) {d.specialization ? `— ${d.specialization}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Language Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-900" />
                <span>WhatsApp Message Language</span>
              </label>
              <div className="flex bg-slate-100 rounded border border-slate-200 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setDealerMsgLang('mr')}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                    dealerMsgLang === 'mr' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-700'
                  }`}
                >
                  मराठी (Marathi)
                </button>
                <button
                  type="button"
                  onClick={() => setDealerMsgLang('hi')}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                    dealerMsgLang === 'hi' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-700'
                  }`}
                >
                  हिंदी (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => setDealerMsgLang('en')}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                    dealerMsgLang === 'en' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-700'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Message Preview Box */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-600">WhatsApp Preview</label>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-950 font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                {buildDealerOrderMessage(dealerMsgLang)}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDealerModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendToDealer}
                disabled={!selectedDealerId}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send WhatsApp Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
