import React, { useState } from 'react';
import { MessageCircle, X, Copy, Check, ExternalLink, Monitor, Globe } from 'lucide-react';
import { openWhatsApp, WhatsAppTarget } from '../../utils/whatsapp';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientPhone: string;
  initialMessage: string;
  defaultTarget?: WhatsAppTarget;
  title?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  recipientPhone,
  initialMessage,
  defaultTarget = 'desktop',
  title = 'Send WhatsApp Message'
}) => {
  const [message, setMessage] = useState<string>(initialMessage);
  const [target, setTarget] = useState<WhatsAppTarget>(defaultTarget);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync initial message when changed
  React.useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSend = () => {
    openWhatsApp(recipientPhone, message, target);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 space-y-4 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500">
                To: <strong className="text-slate-800">{recipientName}</strong> ({recipientPhone || 'No Phone'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Editor Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Message Content (Editable before sending):
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-blue-900 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-blue-900" />
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>

          <textarea
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field font-sans text-xs p-2.5 leading-relaxed resize-y border-slate-300 focus:ring-1 focus:ring-emerald-600"
            placeholder="Type or edit your WhatsApp message here..."
          />
          <p className="text-[10.5px] text-slate-400">
            You can add custom notes, greetings, or discounts right in this box before sending.
          </p>
        </div>

        {/* Dispatch Target Switcher (Windows Desktop App vs Web) */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="text-[11px] font-semibold text-slate-700">Open WhatsApp via:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTarget('desktop')}
              className={`p-2 rounded-md border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                target === 'desktop'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>WhatsApp Windows App</span>
            </button>

            <button
              type="button"
              onClick={() => setTarget('web')}
              className={`p-2 rounded-md border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                target === 'web'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>WhatsApp Web (Browser)</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            {target === 'desktop'
              ? '✓ Directly launches WhatsApp for Windows desktop application (bypasses Chrome web page).'
              : 'Opens web.whatsapp.com in a new browser tab.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!recipientPhone.trim()}
            className="btn-primary text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Launch WhatsApp Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
