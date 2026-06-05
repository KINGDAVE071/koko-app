'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { jsPDF } from 'jspdf';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      api.get(`/invoices/${id}`).then(res => {
        setInvoice(res.data.invoice);
        setItems(res.data.items);
      }).catch(() => {});
    }
  }, [id]);

  const generatePDF = () => {
    if (!invoice) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Facture ${invoice.number}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Client : ${invoice.client_name || 'N/A'}`, 20, 30);
    doc.text(`Date : ${invoice.date}`, 20, 40);
    if (invoice.due_date) doc.text(`Échéance : ${invoice.due_date}`, 20, 50);
    let y = 70;
    items.forEach((item: any) => {
      doc.text(`${item.description} x${item.quantity} = ${(item.quantity * item.unit_price).toFixed(2)}`, 20, y);
      y += 10;
    });
    doc.text(`Total TTC : ${invoice.total_ttc} FCFA`, 20, y + 10);
    doc.save(`facture_${invoice.number}.pdf`);
  };

  if (!invoice) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Facture {invoice.number}</h1>
      <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow space-y-2">
        <p><strong>Client :</strong> {invoice.client_name || 'N/A'}</p>
        <p><strong>Date :</strong> {invoice.date}</p>
        {invoice.due_date && <p><strong>Échéance :</strong> {invoice.due_date}</p>}
        <p><strong>Statut :</strong> {invoice.status}</p>
        <p><strong>Total TTC :</strong> {invoice.total_ttc} FCFA</p>
        <div className="border-t pt-2 mt-2">
          <h2 className="font-semibold">Articles :</h2>
          <ul className="list-disc list-inside">
            {items.map((item: any, idx: number) => (
              <li key={idx}>{item.description} – {item.quantity} x {item.unit_price} FCFA (TVA {item.tva}%)</li>
            ))}
          </ul>
        </div>
        <button onClick={generatePDF} className="mt-4 px-4 py-2 bg-koko-orange text-white rounded-lg">Télécharger PDF</button>
      </div>
    </div>
  );
}
