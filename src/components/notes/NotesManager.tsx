import React, { useState, useMemo, useRef } from 'react';
import { useDb } from '../../context/DbContext';
import { AppNote, Product } from '../../types';
import { formatDate } from '../../utils/formatters';
import { SearchableCombobox, ComboboxOption } from '../common/SearchableCombobox';
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Search,
  Package,
  X,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  Tag,
  Clock,
  Sparkles,
  Layers,
  Upload
} from 'lucide-react';

interface NotesManagerProps {
  initialContent?: string;
  onClearInitialContent?: () => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({
  initialContent,
  onClearInitialContent
}) => {
  const {
    appNotes,
    products,
    saveAppNote,
    deleteAppNote
  } = useDb();

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);
  const [viewingNote, setViewingNote] = useState<AppNote | null>(null);
  const [editingNote, setEditingNote] = useState<AppNote | null>(null);

  // Editor Form Fields
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [selectedProductName, setSelectedProductName] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If initialContent was passed from low stock alert, trigger new note
  React.useEffect(() => {
    if (initialContent) {
      setEditingNote(null);
      setTitle('Inventory Reorder List');
      setContent(initialContent);
      setImageData(undefined);
      setSelectedProductId(undefined);
      setSelectedProductName(undefined);
      setShowEditorModal(true);
      if (onClearInitialContent) onClearInitialContent();
    }
  }, [initialContent, onClearInitialContent]);

  // Product Combobox Options
  const productOptions = useMemo<ComboboxOption[]>(() => {
    return products.map((p) => ({
      id: p.id,
      label: p.name,
      subLabel: `${p.type || p.sku ? `[${p.type || p.sku}] ` : ''}Stock: ${p.stock_qty} ${p.unit}`,
      badge: `₹${p.selling_price}`,
      badgeColor:
        p.stock_qty <= (p.min_stock_alert || 5)
          ? 'bg-rose-100 text-rose-900'
          : 'bg-emerald-100 text-emerald-900',
      data: p
    }));
  }, [products]);

  const handleOpenNewModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setImageData(undefined);
    setSelectedProductId(undefined);
    setSelectedProductName(undefined);
    setShowEditorModal(true);
  };

  const handleOpenEditModal = (note: AppNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setImageData(note.image_data);
    setSelectedProductId(note.product_id);
    setSelectedProductName(note.product_name);
    setViewingNote(null);
    setShowEditorModal(true);
  };

  // Image Upload handler (resizes to max 1200px width/height and compresses to JPEG to keep localStorage fast)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImageData(compressedDataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so user can pick the same file again if desired
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setImageData(undefined);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a note title.');
      return;
    }

    const newNote: AppNote = {
      id: editingNote ? editingNote.id : 'note_' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      note_type: 'GENERAL',
      product_refs: selectedProductId ? [selectedProductId] : [],
      image_data: imageData,
      product_id: selectedProductId,
      product_name: selectedProductName,
      created_at: editingNote ? editingNote.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveAppNote(newNote);
    setShowEditorModal(false);
  };

  const handleDeleteNote = (id: string, noteTitle: string) => {
    if (window.confirm(`Are you sure you want to delete note "${noteTitle}"?`)) {
      deleteAppNote(id);
      if (viewingNote?.id === id) {
        setViewingNote(null);
      }
    }
  };

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    return appNotes.filter((note) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        (note.product_name && note.product_name.toLowerCase().includes(q))
      );
    });
  }, [appNotes, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Visual Notes & Photo Memo
            </h1>
            <p className="text-sm text-slate-500">
              Capture quick notes, upload part slips or photo memos, and link catalog items.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-medium shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Visual Note</span>
        </button>
      </div>

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>Total Notes: {appNotes.length}</span>
          <span className="text-slate-300">•</span>
          <span>With Photos: {appNotes.filter((n) => !!n.image_data).length}</span>
          <span className="text-slate-300">•</span>
          <span>Linked to Products: {appNotes.filter((n) => !!n.product_name).length}</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, slips, products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">No Notes Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No notes match your search keywords.'
              : 'Add photo slips, mechanic requests, or general work memos.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenNewModal}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Create First Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const linkedProd = products.find((p) => p.id === note.product_id);

            return (
              <div
                key={note.id}
                onClick={() => setViewingNote(note)}
                className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-200 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Image Section (Bigger thumbnail) */}
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {note.image_data ? (
                    <img
                      src={note.image_data}
                      alt={note.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon className="w-12 h-12 mb-1" />
                      <span className="text-xs font-medium text-slate-400">No Photo Attached</span>
                    </div>
                  )}

                  {/* Click to Zoom Overlay Indicator */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-medium">
                    <Eye className="w-4 h-4" />
                    <span>Click to View Full</span>
                  </div>

                  {/* Date Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Linked Product Pill */}
                    {note.product_name && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 mb-2.5 max-w-full truncate">
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{note.product_name}</span>
                        {linkedProd?.type && (
                          <span className="text-[10px] bg-purple-200/70 text-purple-800 px-1 rounded shrink-0">
                            {linkedProd.type}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Note Title */}
                    <h3 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {note.title}
                    </h3>

                    {/* Content Snippet */}
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 whitespace-pre-line leading-relaxed">
                      {note.content || 'No text description entered.'}
                    </p>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-400">
                    <span className="text-[11px]">Click card to view details</span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditModal(note)}
                        title="Edit Note"
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id, note.title)}
                        title="Delete Note"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* High-Resolution View Note Popup Modal */}
      {viewingNote && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 shrink-0">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
                  <ClipboardList className="w-4 h-4" />
                  <span>Visual Note Details</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-normal">{formatDate(viewingNote.created_at)}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 break-words">{viewingNote.title}</h2>
              </div>
              <button
                onClick={() => setViewingNote(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {/* Image Preview (High Res) */}
              {viewingNote.image_data ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[420px]">
                  <img
                    src={viewingNote.image_data}
                    alt={viewingNote.title}
                    className="max-h-[420px] w-auto max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                  No image attached to this note.
                </div>
              )}

              {/* Linked Product Information Card */}
              {viewingNote.product_name && (
                <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                        Linked Catalog Product
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{viewingNote.product_name}</div>
                      {(() => {
                        const p = products.find((prod) => prod.id === viewingNote.product_id);
                        if (!p) return null;
                        return (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {p.type && <span className="font-semibold text-purple-600">[{p.type}] </span>}
                            Stock: <span className="font-semibold">{p.stock_qty} {p.unit}</span> • Price: <span className="font-semibold">₹{p.selling_price}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Note Content */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Note Details
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-line leading-relaxed font-mono select-text">
                  {viewingNote.content || '(No additional text)'}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0">
              <button
                onClick={() => handleDeleteNote(viewingNote.id, viewingNote.title)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Note</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(viewingNote)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Note</span>
                </button>
                <button
                  onClick={() => setViewingNote(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal (Create / Edit) */}
      {showEditorModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl my-6 border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingNote ? 'Edit Visual Note' : 'Create Visual Note'}
                  </h3>
                  <p className="text-xs text-slate-500">Attach photo slip and link catalog product</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 pt-4">
              {/* Note Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Split AC Compressor Slip, Ramesh Mechanic Requirement"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Photo Upload / Camera Capture */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Photo / Slip / Part Picture
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {imageData ? (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900 group h-48 flex items-center justify-center">
                    <img
                      src={imageData}
                      alt="Uploaded Note"
                      className="max-h-48 w-auto max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors shadow-xs"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-purple-50/20"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      Upload photo or take a picture
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Supports PNG, JPG, JPEG (slips, part labels, mechanic notes)
                    </div>
                  </div>
                )}
              </div>

              {/* Link Catalog Product Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Link Catalog Product (Optional)
                  </label>
                  {selectedProductId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductId(undefined);
                        setSelectedProductName(undefined);
                      }}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      Clear Link
                    </button>
                  )}
                </div>
                <SearchableCombobox
                  options={productOptions}
                  value={selectedProductName || ''}
                  onChange={(val) => setSelectedProductName(val)}
                  onSelectOption={(opt) => {
                    setSelectedProductName(opt.label);
                    setSelectedProductId(opt.id);
                  }}
                  placeholder="Select product to link with this note..."
                />
              </div>

              {/* Note Content Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Content / Memo
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type note details, mechanic specifications, order quantities, or reminders..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none resize-none font-mono"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
                >
                  {editingNote ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
