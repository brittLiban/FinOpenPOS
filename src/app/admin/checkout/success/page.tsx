'use client';

import { useEffect, useState, useRef } from 'react';

export default function CheckoutSuccessPage() {
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get('session_id');

    if (sessionId) {
      fetch(`/api/checkout/session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => setSessionDetails(data));
    }
  }, []);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', 'PRINT', 'height=650,width=900');
      printWindow?.document.write('<html><head><title>Receipt</title></head><body>');
      printWindow?.document.write(receiptRef.current.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      printWindow?.focus();
      printWindow?.print();
      printWindow?.close();
    }
  };

  if (!sessionDetails) return <p className="p-6">Loading receipt...</p>;

  const business = {
    name: process.env.NEXT_PUBLIC_BUSINESS_NAME || "FinOpenPOS",
    address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "123 Business Rd, Seattle, WA",
    phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "(555) 123-4567",
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "support@finopenpos.com",
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">✅ Payment Successful</h1>

      <div
        ref={receiptRef}
        className="bg-white p-6 shadow rounded-md max-w-lg mx-auto text-sm font-mono border"
      >
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">{business.name}</h2>
          <p>{business.address}</p>
          <p>{business.phone}</p>
          <p>{business.email}</p>
        </div>

        <hr className="my-2" />

        <p><strong>Receipt #: </strong> {sessionDetails.id}</p>
        <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Status:</strong> {sessionDetails.payment_status}</p>

        <hr className="my-2" />

        <p className="font-semibold mt-2 mb-1">👤 Customer Info:</p>
        <p>{sessionDetails.customer_details.name}</p>
        <p>{sessionDetails.customer_details.email}</p>

        <hr className="my-2" />

        <p className="font-semibold mt-2 mb-1">🛒 Items:</p>
        {sessionDetails.display_items?.length > 0 ? (
          sessionDetails.display_items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between">
              <span>{item.custom.name}</span>
              <span>${(item.amount / 100).toFixed(2)}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between">
            <span>Test Product</span>
            <span>${(sessionDetails.amount_total / 100).toFixed(2)}</span>
          </div>
        )}

        <hr className="my-2" />

        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${(sessionDetails.amount_total / 100).toFixed(2)}</span>
        </div>

        <hr className="my-2" />

        <p className="text-center mt-4 italic text-xs text-gray-500">
          Thank you for your business! For help, call us at {business.phone}
        </p>
      </div>

      <button
        onClick={handlePrint}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        🖨️ Print Receipt
      </button>
    </div>
  );
}
