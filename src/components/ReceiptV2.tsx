'use client';

import { useState, useEffect } from 'react';
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
  const [logo, setLogo] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Récupérer le logo depuis le contexte ou directement depuis l'API
  useEffect(() => {
    if (user?.logo) {
      setLogo(user.logo);
    } else {
      // Si le logo n'est pas dans le contexte, tenter un appel API
      api.get('/auth-logo/logo')
        .then(res => {
          if (res.data.logo) setLogo(res.data.logo);
        })
        .catch(() => {});
    }
  }, [user]);

  const handlePrint = () => {
    const content = document.getElementById(`receipt-${receipt.id}`);
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Reçu ${receipt.hash}</title></head>
          <body style="font-family: monospace; font-size: 12px; display: flex; justify-content: center;">
            ${content.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

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
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => onSelect(receipt.id)}
            className="absolute top-1 left-1 w-3 h-3"
          />
        )}
        <div id={`receipt-${receipt.id}`} className="bg-white dark:bg-gray-900 p-3 rounded text-center">
          {logo && (
            <div className="mb-2 flex justify-center">
              <img
                src={logo}
                alt="Logo"
                className="max-h-12 max-w-full object-contain opacity-90"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          )}
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
        <div className="flex justify-between mt-1 gap-1">
          <button onClick={() => setShowPreview(true)} className="flex-1 py-1 bg-koko-orange text-white rounded text-xs flex items-center justify-center">
            <Eye size={12} className="mr-1" /> Aperçu
          </button>
          <button onClick={handlePrint} className="flex-1 py-1 bg-koko-orange text-white rounded text-xs flex items-center
justify-center">
            <Printer size={12} className="mr-1" /> Imprimer
          </button>
          <button onClick={handleDelete} className="flex-1 py-1 bg-red-500 text-white rounded text-xs">
            <X size={12} className="inline mr-1" />Suppr.
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg w-80 text-xs font-mono" onClick={e => e.stopPropagation()}>
            {logo && (
              <div className="mb-2 flex justify-center">
                <img
                  src={logo}
                  alt="Logo"
                  className="max-h-12 max-w-full object-contain opacity-90"
                />
              </div>
            )}
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
