'use client';

import { useLanguage } from '@/i18n/LanguageContext';

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

export default function ReceiptTicket({ receipt }: { receipt: Receipt }) {
  const { t } = useLanguage();

  const handlePrint = () => {
    const content = document.getElementById(`receipt-${receipt.id}`);
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content.outerHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shadow-inner text-xs font-mono" id={`receipt-${receipt.id}`}>
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
      <button onClick={handlePrint} className="w-full mt-1 py-1 bg-koko-orange text-white rounded text-xs">Imprimer</button>
    </div>
  );
}
