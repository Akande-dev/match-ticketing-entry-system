// Money formatting. Amounts are stored in kobo (1/100 naira) and shown in naira.

const fmt = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
/** Amounts are stored in minor units (kobo). */
export const formatMoney = (minor) => fmt.format((minor ?? 0) / 100);
