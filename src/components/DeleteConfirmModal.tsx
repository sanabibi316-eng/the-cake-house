import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen?: boolean;
  open?: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  open,
  title = 'Delete Item',
  message = 'Are you sure you want to remove this item?',
  onClose,
  onConfirm,
  confirmText = 'Confirm Delete',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  const isVisible = isOpen ?? open ?? false;
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E8E0D9] shadow-2xl text-center animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold text-[#302725]">{title}</h3>
          <p className="text-xs text-[#80736F] leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-xs font-semibold text-[#80736F] hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
