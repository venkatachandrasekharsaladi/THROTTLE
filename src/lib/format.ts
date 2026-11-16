const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const num = new Intl.NumberFormat("en-GB");

export const formatGbp = (value: number) => gbp.format(value);
export const formatMiles = (value: number) => `${num.format(value)} mi`;
export const formatNumber = (value: number) => num.format(value);
/** UK pump prices are quoted in pence per litre, e.g. 157.9p */
export const formatPence = (pence: number) => `${pence.toFixed(1)}p`;
export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** Full ISO date-time, shown in local time, e.g. "24 Oct 2026, 09:30". */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
