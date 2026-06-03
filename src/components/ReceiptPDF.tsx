'use client';

import { jsPDF } from 'jspdf';
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
  created_at: string;
}

interface Props {
  receipt: Receipt;
}

export default function ReceiptPDF({ receipt }: Props) {
  const { t } = useLanguage();

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('KOKO - Quittance', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type : ${receipt.type}`, 20, 30);
    doc.text(`De : ${receipt.from_name}`, 20, 40);
    doc.text(`À : ${receipt.to_name}`, 20, 50);
    doc.text(`Montant : ${receipt.amount} ${receipt.currency}`, 20, 60);
    if (receipt.description) {
      doc.text(`Description : ${receipt.description}`, 20, 70);
    }
    if (receipt.location) {
      doc.text(`Lieu : ${receipt.location}`, 20, 80);
    }
    doc.text(`Date : ${new Date(receipt.created_at).toLocaleDateString()}`, 20, 90);
    doc.save(`quittance_${receipt.id}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="text-sm text-koko-orange hover:text-koko-orange-dark transition-colors"
    >
      📄 PDF
    </button>
  );
}
