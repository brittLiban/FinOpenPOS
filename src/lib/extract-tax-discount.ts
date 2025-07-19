// Utility to extract tax and discount from Stripe session metadata (if present)
export function extractTaxAndDiscount(session: any) {
  // Try to get from metadata, fallback to 0
  let taxRate = 0;
  let taxAmount = 0;
  let discount = 0;
  if (session?.metadata) {
    if (session.metadata.tax_rate) taxRate = Number(session.metadata.tax_rate);
    if (session.metadata.tax_amount) taxAmount = Number(session.metadata.tax_amount);
    if (session.metadata.discount) discount = Number(session.metadata.discount);
  }
  return { taxRate, taxAmount, discount };
}
