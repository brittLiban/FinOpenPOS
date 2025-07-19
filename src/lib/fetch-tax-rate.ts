// Utility to fetch the tax rate from the settings API
export async function fetchTaxRate(): Promise<number> {
  try {
    const res = await fetch("/api/settings?key=tax_rate");
    const data = await res.json();
    if (data.value !== undefined && !isNaN(Number(data.value))) {
      return Number(data.value);
    }
  } catch {}
  return 0;
}
