'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { X, Eye } from 'lucide-react';
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
  const { t } = useLanguage();
  const [showPreview, setShowPreview] = useState(false);

  const handleDelete = async () => {
    if (confirm('Supprimer ce reçu ?')) {
      try {
        await api.delete(`/receipts/${receipt.id}`);
        if (onDelete) onDelete(receipt.id);
      } catch (err) {
        alert('Erreur lors de la suppression.');
      }
    }
  };

  return (
    <>
      <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shadow-inner text-xs font-mono relative">
        {/* Case à cocher pour sélection groupée */}
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => onSelect(receipt.id)}
            className="absolute top-1 left-1 w-3 h-3"
          />
        )}
        <div className="bg-white dark:bg-gray-900 p-3 rounded text-center">
          <p className="font-bold text-sm">KOKO - Reçu</p>
          <p className="text-gray-500">{new Date(receipt.created_at).toLocaleString()}</p>
          <hr className="my-1 border-dashed border-gray-300" />
          <p className="font-semibold">{receipt.type.toUpperCase()}</p>
          <p>{receipt.from_name} → {receipt.to_name}</p>
          <p className="text-lg font-bold my-1">{receipt.amount} {receipt.currency}</p>
          {receipt.description && <p className="text-gray-500">{receipt.description}</p>}
          {receipt.location && <p className="text-gray-500">{receipt.location}</p>}
          <hr className="my-1 border-dashed border-gray-300" />
          <p className="text-gray-400">#{receipt.hash}</p>
          <p className="text-gray-400">ID: {receipt.id}</p>
        </div>
        <div className="flex justify-between mt-1">
          <button onClick={() => setShowPreview(true)} className="flex-1 py-1 bg-koko-orange text-white rounded text-xs flex items-center justify-center">
            <Eye size={12} className="mr-1" /> Aperçu
          </button>
          <button onClick={handleDelete} className="flex-1 py-1 bg-red-500 text-white rounded text-xs ml-1">
            <X size={12} className="inline mr-1" />Suppr.
          </button>
        </div>
      </div>

      {/* Modale d'aperçu */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg w-80 text-xs font-mono" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <p className="font-bold text-sm">KOKO - Reçu</p>
              <p className="text-gray-500">{new Date(receipt.created_at).toLocaleString()}</p>
              <hr className="my-1 border-dashed border-gray-300" />
              <p className="font-semibold">{receipt.type.toUpperCase()}</p>
              <p>{receipt.from_name} → {receipt.to_name}</p>
              <p className="text-lg font-bold my-1">{receipt.amount} {receipt.currency}</p>
              {receipt.description && <p className="text-gray-500">{receipt.description}</p>}
              {receipt.location && <p className="text-gray-500">{receipt.location}</p>}
              <hr className="my-1 border-dashed border-gray-300" />
              <p className="text-gray-400">#{receipt.hash}</p>
              <p className="text-gray-400">ID: {receipt.id}</p>
            </div>
            <button onClick={() => setShowPreview(false)} className="w-full mt-2 py-1 bg-koko-orange text-white rounded text-xs">Fermer</button>
          </div>
        </div>
      )}
    </>
  );
}
