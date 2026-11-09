import React from 'react';
import { Phone, PhoneCall, Copy, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface CustomerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  customerPhone: string;
}

/**
 * Normalizes any Pakistani or international phone number into a valid E.164 / RFC 3966 string for tel: URI.
 * Handles formats such as:
 * - '03440114925' -> '+923440114925'
 * - '+923440114925' -> '+923440114925'
 * - '923440114925' -> '+923440114925'
 * - '+92 344 0114925' -> '+923440114925'
 * - '0344-0114925' -> '+923440114925'
 * - '0300 1234567' -> '+923001234567'
 * - '00923440114925' -> '+923440114925'
 * - '3440114925' -> '+923440114925'
 */
export const normalizePakistaniPhone = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.trim();

  // If starts with 00 (international prefix), replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  const hasLeadingPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return '';

  // 1. Pakistani country code already present (e.g. 923440114925, +92 344 0114925)
  if (digits.startsWith('92')) {
    return `+${digits}`;
  }

  // 2. Local Pakistani number with leading 0 (e.g. 03440114925, 0300-1234567, 042-3571234)
  if (digits.startsWith('0')) {
    return `+92${digits.slice(1)}`;
  }

  // 3. 10-digit mobile number starting with 3 (e.g. 3440114925)
  if (digits.length === 10 && digits.startsWith('3')) {
    return `+92${digits}`;
  }

  // 4. Other international number with leading plus (e.g. +1 555 123 4567)
  if (hasLeadingPlus) {
    return `+${digits}`;
  }

  // 5. Default fallback: prepend +92
  return `+92${digits}`;
};

export const CustomerContactModal: React.FC<CustomerContactModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerPhone
}) => {
  const { showToast } = useApp();

  if (!isOpen) return null;

  const normalizedPhone = normalizePakistaniPhone(customerPhone);
  const telHref = normalizedPhone ? `tel:${normalizedPhone}` : '#';

  const handleCopy = async () => {
    if (!customerPhone) {
      showToast('No phone number available for this customer', 'error');
      onClose();
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(customerPhone);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = customerPhone;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error('Clipboard copy command was unsuccessful');
        }
      }
      onClose();
      showToast('Customer phone number copied successfully!');
    } catch (err) {
      console.error('Failed to copy phone number to clipboard:', err);
      showToast('Failed to copy phone number to clipboard', 'error');
    }
  };

  const handleCall = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!normalizedPhone) {
      e.preventDefault();
      showToast('No phone number available for this customer', 'error');
      onClose();
      return;
    }
    // Allow the browser to dispatch the tel: protocol invocation before closing
    setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 border border-[#E8E0D9] shadow-2xl text-center animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-contact-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#80736F] hover:text-[#302725] hover:bg-[#FAF7F2] transition cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Suitable Phone Icon in Cake House Burgundy Palette */}
        <div className="w-14 h-14 rounded-2xl bg-[#762F3D]/10 text-[#762F3D] flex items-center justify-center mx-auto shadow-inner">
          <Phone className="w-7 h-7" />
        </div>

        {/* Title and Message */}
        <div className="space-y-1.5">
          <h3 id="customer-contact-title" className="font-serif text-xl font-bold text-[#302725]">
            Customer Contact
          </h3>
          <p className="text-xs text-[#80736F] leading-relaxed">
            Would you like to call this customer now or copy their phone number?
          </p>
        </div>

        {/* Clear Display of Customer Name & Phone Number */}
        <div className="bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl p-4 text-center space-y-1">
          {customerName && (
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#80736F]">
              {customerName}
            </div>
          )}
          <div className="text-base sm:text-lg font-bold text-[#762F3D] tracking-wide flex items-center justify-center gap-2 select-all">
            <Phone className="w-4 h-4 text-[#762F3D]/70 shrink-0" />
            <span>{customerPhone}</span>
          </div>
        </div>

        {/* Action Buttons: Copy Number, Call Now, Cancel */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl border border-[#E8E0D9] bg-white hover:bg-[#FAF7F2] text-[#302725] text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer select-none"
            >
              <Copy className="w-3.5 h-3.5 text-[#762F3D]" />
              <span>Copy Number</span>
            </button>

            <a
              href={telHref}
              onClick={handleCall}
              className="py-2.5 px-3 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer select-none"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#C5A46D]" />
              <span>Call Now</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E8E0D9] text-xs font-semibold text-[#80736F] hover:bg-[#FAF7F2] hover:text-[#302725] transition cursor-pointer select-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
