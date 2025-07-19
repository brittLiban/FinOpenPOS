'use client';

import { useEffect, useState, useRef } from 'react';
import { extractTaxAndDiscount } from '@/lib/extract-tax-discount';

export default function CheckoutSuccessPage() {
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get('session_id');

    if (sessionId) {
      fetch(`/api/checkout/session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setSessionDetails(data);

          const products = data.line_items?.data?.map((item: any) => ({
            id: item.price?.product?.metadata?.product_id,
            quantity: item.quantity,
            price: item.amount_total / 100,
          })) ?? [];

          const payload = {
            customer_id: null,
            customer_name: data.customer_details?.name || "Guest",
            customer_email: data.customer_details?.email || "",
            payment_method_name: data.payment_method_types?.[0] || "Card",
            payment_method_id: null,
            total_amount: data.amount_total ? data.amount_total / 100 : 0,
            status: data.payment_status === 'paid' ? 'completed' : 'pending',
            products,
            stripe_session_id: data.id,
          };

          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
            .then((res) => res.json())
            .then((json) => console.log('✅ Order posted:', json))
            .catch((err) => console.error('❌ Order POST failed:', err));
        });
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

  // Extract tax/discount from session metadata if present
  const { taxRate, taxAmount, discount } = extractTaxAndDiscount(sessionDetails);
  const total = sessionDetails.amount_total ? sessionDetails.amount_total / 100 : 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">✅ Payment Successful</h1>

      <div ref={receiptRef} className="bg-white p-6 shadow rounded-md max-w-lg mx-auto text-sm font-mono border">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">{business.name}</h2>
          <p>{business.address}</p>
          <p>{business.phone}</p>
          <p>{business.email}</p>
        </div>

        <hr className="my-2" />

        <p><strong>Receipt #:</strong> {sessionDetails.id}</p>
        <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Status:</strong> {sessionDetails.payment_status}</p>

        <hr className="my-2" />

        <p className="font-semibold mt-2 mb-1">👤 Customer Info:</p>
        <p>{sessionDetails.customer_details?.name}</p>
        <p>{sessionDetails.customer_details?.email}</p>

        <hr className="my-2" />

        <p className="font-semibold mt-2 mb-1">🛒 Items:</p>
        {sessionDetails.line_items?.data?.length > 0 ? (
          sessionDetails.line_items.data.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between">
              <span>{item.description || item.price.product.name}</span>
              <span>${(item.amount_total / 100).toFixed(2)}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between">
            <span>Test Product</span>
            <span>${(sessionDetails.amount_total / 100).toFixed(2)}</span>
          </div>
        )}

        <hr className="my-2" />
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>- ${discount.toFixed(2)}</span>
          </div>
        )}
        {taxRate > 0 && (
          <div className="flex justify-between">
            <span>Tax ({taxRate.toFixed(2)}%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <hr className="my-2" />
        <p className="text-center mt-4 italic text-xs text-gray-500">
          Thank you for your business! For help, call us at {business.phone}
        </p>
        <p className="text-center mt-2 text-xs text-gray-400">* Only admins can adjust the tax rate in settings.</p>
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
