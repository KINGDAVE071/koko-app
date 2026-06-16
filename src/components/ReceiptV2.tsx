'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Eye, Printer } from 'lucide-react';
import api from '@/lib/api';

interface Receipt {
  id: number;
  type: string;
  from_name: string;
  to_name: string;
  amount: number;
  currency: string;
  description?: string;
  location?: string;
  hash: string;
  created_at: string;
}

interface Props {
  receipt: Receipt;
  onDelete?: (id: number) => void;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
}

export default function ReceiptV2({ receipt, onDelete, isSelected, onSelect }: Props) {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const logoSrc = user?.logo || null;

  const handlePrint = () => {
    const content = document.getElementById(`receipt-${receipt.id}`);
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>Reçu ${receipt.hash}</title><style>body{font-family:monospace;font-size:12px;display:flex;justify-content:center;margin:0;padding:16px;background:white;color:black;}</style></head><body>${content.outerHTML}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDelete = async () => {
    if (confirm('Supprimer ce reçu ?')) {
      try { await api.delete(`/receipts/${receipt.id}`); if (onDelete) onDelete(receipt.id); }
      catch (err) { alert('Erreur lors de la suppression.'); }
    }
  };

  return (
    <>
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-xl shadow-md dark:shadow-[0_4px_16px_rgba(230,126,34,0.1)] p-2 text-xs font-mono relative text-gray-800 dark:text-white">
        {onSelect && (
          <input type="checkbox" checked={isSelected || false} onChange={() => onSelect(receipt.id)} className="absolute top-2 left-2 w-3 h-3" />
        )}
        <div id={`receipt-${receipt.id}`} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
          {logoSrc && (
            <div className="mb-2 flex justify-center">
              <img src={logoSrc} alt="Logo" className="max-h-8 max-w-full object-contain" />
            </div>
          )}
          <p className="font-bold text-sm">KOKO - Reçu</p>
          <p className="text-gray-500 dark:text-gray-400">{new Date(receipt.created_at).toLocaleString()}</p>
          <hr className="my-1 border-dashed border-gray-300 dark:border-gray-600" />
          <p className="font-semibold">{receipt.type.toUpperCase()}</p>
          <p>{receipt.from_name} → {receipt.to_name}</p>
          <p className="text-lg font-bold my-1 text-koko-orange">{receipt.amount} {receipt.currency}</p>
          {receipt.description && <p className="text-gray-500 dark:text-gray-400">{receipt.description}</p>}
          {receipt.location && <p className="text-gray-500 dark:text-gray-400">{receipt.location}</p>}
          <hr className="my-1 border-dashed border-gray-300 dark:border-gray-600" />
          <p className="text-gray-400 dark:text-gray-500 text-[10px]">#{receipt.hash}</p>
          <p className="text-gray-400 dark:text-gray-500 text-[10px]">ID: {receipt.id}</p>
        </div>
        <div className="flex gap-1 mt-2">
          <button onClick={() => setShowPreview(true)} className="flex-1 py-1.5 rounded-lg bg-koko-orange hover:bg-koko-orange-dark text-white text-xs flex items-center justify-center gap-1 transition">
            <Eye size={12} /> Aperçu
          </button>
          <button onClick={handlePrint} className="flex-1 py-1.5 rounded-lg bg-koko-orange hover:bg-koko-orange-dark text-white text-xs flex items-center justify-center gap-1 transition">
            <Printer size={12} /> Imprimer
          </button>
          <button onClick={handleDelete} className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center gap-1 transition">
            <X size={12} /> Suppr.
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-koko-orange/20 rounded-2xl p-4 shadow-2xl w-80 text-xs font-mono text-gray-800 dark:text-white" onClick={e => e.stopPropagation()}>
            {logoSrc && (
              <div className="mb-2 flex justify-center">
                <img src={logoSrc} alt="Logo" className="max-h-10 max-w-full object-contain" />
              </div>
            )}
            <div className="text-center">
              <p className="font-bold text-sm">KOKO - Reçu</p>
              <p className="text-gray-500 dark:text-gray-400">{new Date(receipt.created_at).toLocaleString()}</p>
              <hr className="my-1 border-dashed border-gray-300 dark:border-gray-600" />
              <p className="font-semibold">{receipt.type.toUpperCase()}</p>
              <p>{receipt.from_name} → {receipt.to_name}</p>
              <p className="text-lg font-bold my-1 text-koko-orange">{receipt.amount} {receipt.currency}</p>
              {receipt.description && <p className="text-gray-500 dark:text-gray-400">{receipt.description}</p>}
              {receipt.location && <p className="text-gray-500 dark:text-gray-400">{receipt.location}</p>}
              <hr className="my-1 border-dashed border-gray-300 dark:border-gray-600" />
              <p className="text-gray-400 dark:text-gray-500 text-[10px]">#{receipt.hash}</p>
              <p className="text-gray-400 dark:text-gray-500 text-[10px]">ID: {receipt.id}</p>
            </div>
            <button onClick={() => setShowPreview(false)} className="w-full mt-3 py-1.5 rounded-lg bg-koko-orange hover:bg-koko-orange-dark text-white text-xs transition">Fermer</button>
          </div>
        </div>
      )}
    </>
  );
}
