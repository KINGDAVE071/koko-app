'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Eye, Printer } from 'lucide-react';
import api from '@/lib/api';

interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

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
  items?: SaleItem[];  // fourni par le backend pour les ventes
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
      printWindow.document.write(`<html><head><title>Reçu ${receipt.hash}</title><style>body{font-family:monospace;font-size:12px;display:flex;justify-content:center;margin:0;padding:16px;background:white;color:black;}table{width:100%;border-collapse:collapse;}td,th{border-bottom:1px dashed #ccc;padding:4px 0;text-align:left;}.total{font-weight:bold;}</style></head><body>${content.outerHTML}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDelete = async () => {
    if (confirm('Supprimer ce reçu ? (l\'historique de vente est conservé)')) {
      try {
        await api.delete(`/receipts/${receipt.id}`);
        if (onDelete) onDelete(receipt.id);
      } catch (err) {
        alert('Erreur lors de la suppression.');
      }
    }
  };

  const items = receipt.items && receipt.items.length > 0 ? receipt.items : undefined;
  const totalTTC = items ? items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0) : receipt.amount;

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
          <p className="font-bold text-sm">KOKO – Reçu</p>
          <p className="text-gray-500 dark:text-gray-400 text-[10px]">{new Date(receipt.created_at).toLocaleString()}</p>
          <hr className="my-2 border-dashed border-gray-300 dark:border-gray-600" />
          {items ? (
            <table className="w-full text-left text-[10px] mt-1">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400">
                  <th>Article</th><th className="text-right">Qté</th><th className="text-right">Prix</th><th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.product_name}</td>
                    <td className="text-right">{it.quantity}</td>
                    <td className="text-right">{it.unit_price.toLocaleString()}</td>
                    <td className="text-right">{(it.unit_price * it.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={3} className="text-right">Total TTC</td>
                  <td className="text-right text-koko-orange">{totalTTC.toLocaleString()} FCFA</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <>
              <p className="font-semibold">{receipt.type.toUpperCase()}</p>
              <p>{receipt.from_name} → {receipt.to_name}</p>
              <p className="text-lg font-bold my-1 text-koko-orange">{receipt.amount} {receipt.currency}</p>
            </>
          )}
          {receipt.description && <p className="text-gray-500 dark:text-gray-400 mt-1 text-[10px]">{receipt.description}</p>}
          <hr className="my-2 border-dashed border-gray-300 dark:border-gray-600" />
          <p className="text-gray-400 dark:text-gray-500 text-[10px]">#{receipt.hash}</p>
          <div className="mt-3 pt-2 border-t-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-[10px]">Merci de votre visite !</p>
            <p className="text-gray-400 dark:text-gray-500 text-[10px]">KOKO – Simplifiez votre quotidien</p>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1">---</p>
          </div>
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
            {/* Même contenu que le ticket */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
              {logoSrc && (
                <div className="mb-2 flex justify-center">
                  <img src={logoSrc} alt="Logo" className="max-h-10 max-w-full object-contain" />
                </div>
              )}
              <p className="font-bold text-sm">KOKO – Reçu</p>
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">{new Date(receipt.created_at).toLocaleString()}</p>
              <hr className="my-2 border-dashed border-gray-300 dark:border-gray-600" />
              {items ? (
                <table className="w-full text-left text-[10px] mt-1">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400">
                      <th>Article</th><th className="text-right">Qté</th><th className="text-right">Prix</th><th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.product_name}</td>
                        <td className="text-right">{it.quantity}</td>
                        <td className="text-right">{it.unit_price.toLocaleString()}</td>
                        <td className="text-right">{(it.unit_price * it.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan={3} className="text-right">Total TTC</td>
                      <td className="text-right text-koko-orange">{totalTTC.toLocaleString()} FCFA</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <>
                  <p className="font-semibold">{receipt.type.toUpperCase()}</p>
                  <p>{receipt.from_name} → {receipt.to_name}</p>
                  <p className="text-lg font-bold my-1 text-koko-orange">{receipt.amount} {receipt.currency}</p>
                </>
              )}
              {receipt.description && <p className="text-gray-500 dark:text-gray-400 mt-1 text-[10px]">{receipt.description}</p>}
              <hr className="my-2 border-dashed border-gray-300 dark:border-gray-600" />
              <p className="text-gray-400 dark:text-gray-500 text-[10px]">#{receipt.hash}</p>
              <div className="mt-3 pt-2 border-t-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-[10px]">Merci de votre visite !</p>
                <p className="text-gray-400 dark:text-gray-500 text-[10px]">KOKO – Simplifiez votre quotidien</p>
                <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1">---</p>
              </div>
            </div>
            <button onClick={() => setShowPreview(false)} className="w-full mt-3 py-1.5 rounded-lg bg-koko-orange hover:bg-koko-orange-dark text-white text-xs transition">Fermer</button>
          </div>
        </div>
      )}
    </>
  );
}
