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
  items?: SaleItem[];
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
    const printWindow = window.open('', '_blank', 'width=300,height=500');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Reçu ${receipt.hash}</title>
            <style>
              @page { size: 80mm auto; margin: 2mm; }
              body { font-family: 'Courier New', monospace; font-size: 11px; width: 76mm; margin: 0 auto; padding: 0; color: black; background: white; }
              table { width: 100%; border-collapse: collapse; }
              td, th { padding: 2px 0; }
              .center { text-align: center; }
              .right { text-align: right; }
              .dashed { border-top: 1px dashed #000; margin: 4px 0; }
              .bold { font-weight: bold; }
              .small { font-size: 9px; }
              .warning { font-size: 8px; border: 1px solid #000; padding: 4px; margin-top: 8px; text-align: center; }
            </style>
          </head>
          <body>
            ${content!.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDelete = async () => {
    if (confirm("Supprimer ce reçu ? (l'historique de vente est conservé)")) {
      try {
        await api.delete(`/receipts/${receipt.id}`);
        if (onDelete) onDelete(receipt.id);
      } catch (err) {
        alert('Erreur lors de la suppression.');
      }
    }
  };

  const items = receipt.items && receipt.items.length > 0 ? receipt.items : undefined;
  const totalTTC = items
    ? items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)
    : receipt.amount;

  // Contenu du ticket (réutilisé pour la prévisualisation et l'impression)
  const ticketContent = (
    <div className="center" style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: 'black', background: 'white' }}>
      {logoSrc && (
        <div className="center" style={{ marginBottom: '4px' }}>
          <img src={logoSrc} alt="Logo" style={{ maxHeight: '36px', maxWidth: '100%' }} />
        </div>
      )}
      <p className="bold" style={{ fontSize: '13px', margin: '0 0 2px 0' }}>KOKO – Reçu</p>
      <p className="small" style={{ margin: '0 0 2px 0' }}>{new Date(receipt.created_at).toLocaleString()}</p>
      <div className="dashed" />
      {items ? (
        <table style={{ width: '100%', fontSize: '10px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Article</th>
              <th style={{ textAlign: 'right' }}>Qté</th>
              <th style={{ textAlign: 'right' }}>Prix</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'left' }}>{it.product_name}</td>
                <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                <td style={{ textAlign: 'right' }}>{it.unit_price.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{(it.unit_price * it.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bold">
              <td colSpan={3} style={{ textAlign: 'right' }}>Total TTC</td>
              <td style={{ textAlign: 'right', color: '#E67E22' }}>{totalTTC.toLocaleString()} FCFA</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <>
          <p className="bold" style={{ margin: '2px 0' }}>{receipt.type.toUpperCase()}</p>
          <p style={{ margin: '1px 0' }}>{receipt.from_name} → {receipt.to_name}</p>
          <p className="bold" style={{ fontSize: '16px', margin: '4px 0', color: '#E67E22' }}>{receipt.amount} {receipt.currency}</p>
        </>
      )}
      {receipt.description && (
        <p className="small" style={{ margin: '2px 0' }}>{receipt.description}</p>
      )}
      <div className="dashed" />
      <p className="small" style={{ margin: '2px 0' }}>#{receipt.hash}</p>
      <p className="small" style={{ margin: '2px 0' }}>Merci de votre visite !</p>
      <div className="warning">
        <p className="bold" style={{ margin: '0 0 2px 0', fontSize: '8px' }}>⚠ MISE EN GARDE</p>
        <p style={{ margin: '0', fontSize: '8px' }}>
          Ce ticket est le seul justificatif de votre achat. En cas de perte, aucune réclamation ne pourra être traitée. Conservez-le précieusement.
        </p>
      </div>
      <p className="small" style={{ marginTop: '6px' }}>2026 KOKO® – Tous droits réservés</p>
    </div>
  );

  return (
    <>
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-xl shadow-md dark:shadow-[0_4px_16px_rgba(230,126,34,0.1)] p-2 text-xs font-mono relative text-gray-800 dark:text-white">
        {onSelect && (
          <input type="checkbox" checked={isSelected || false} onChange={() => onSelect(receipt.id)} className="absolute top-2 left-2 w-3 h-3" />
        )}
        <div id={`receipt-${receipt.id}`} style={{ background: 'white', color: 'black', fontFamily: "'Courier New', monospace", fontSize: '11px', borderRadius: '8px', padding: '12px' }}>
          {ticketContent}
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
          <div className="bg-white rounded-2xl shadow-2xl w-80 text-xs overflow-hidden" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ background: 'white', color: 'black', fontFamily: "'Courier New', monospace", fontSize: '11px', padding: '16px' }}>
              {ticketContent}
            </div>
            <button onClick={() => setShowPreview(false)} className="w-full py-2 bg-koko-orange hover:bg-koko-orange-dark text-white text-xs font-bold transition">
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
