export default function CheckoutCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
      <p className="text-lg text-gray-700 mb-6">You cancelled the checkout process.</p>
      <a href="/admin" className="text-blue-500 underline">Back to Dashboard</a>
    </div>
  );
}
