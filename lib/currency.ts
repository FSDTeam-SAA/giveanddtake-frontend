/**
 * Website checkout can charge in a few local currencies so web buyers see the
 * same figure the App Store / Google Play show them (e.g. £6.99 in the UK).
 * The server decides the real charge; this file only picks which currency to
 * ask for and formats prices for display.
 */
export const SUPPORTED_CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AUD"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABEL: Record<Currency, string> = {
  USD: "US$ USD",
  GBP: "£ GBP",
  EUR: "€ EUR",
  CAD: "CA$ CAD",
  AUD: "A$ AUD",
};

export type LocalPrices = Partial<Record<Exclude<Currency, "USD">, number>>;
type Priced = { price: number; localPrices?: LocalPrices | null };

const STORAGE_KEY = "evp_currency";

export const isCurrency = (value: unknown): value is Currency =>
  typeof value === "string" &&
  (SUPPORTED_CURRENCIES as readonly string[]).includes(value.toUpperCase());

export const normalizeCurrency = (value: unknown): Currency =>
  isCurrency(value) ? (value.toUpperCase() as Currency) : "USD";

// Euro-area countries (incl. Bulgaria, which uses EUR on the App Store).
const EUR_REGIONS = new Set([
  "AT", "BE", "BG", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES", "MC", "SM", "VA",
  "AD", "ME", "XK",
]);

const regionToCurrency = (region?: string | null): Currency | null => {
  const code = (region || "").toUpperCase();
  if (!code) return null;
  if (["GB", "UK", "GG", "JE", "IM"].includes(code)) return "GBP";
  if (code === "CA") return "CAD";
  if (code === "AU") return "AUD";
  if (EUR_REGIONS.has(code)) return "EUR";
  return null;
};

// Time zones are the more reliable location hint: an "en-US" browser in
// London still reports Europe/London.
const EUR_ZONES = new Set([
  "Vienna", "Brussels", "Sofia", "Zagreb", "Nicosia", "Famagusta", "Tallinn",
  "Helsinki", "Mariehamn", "Paris", "Berlin", "Busingen", "Athens", "Dublin",
  "Rome", "Riga", "Vilnius", "Luxembourg", "Malta", "Amsterdam", "Lisbon",
  "Bratislava", "Ljubljana", "Madrid", "Monaco", "San_Marino", "Vatican",
  "Andorra", "Podgorica",
]);
const CANADA_ZONES = new Set([
  "Toronto", "Vancouver", "Edmonton", "Winnipeg", "Halifax", "St_Johns",
  "Regina", "Moncton", "Glace_Bay", "Goose_Bay", "Whitehorse", "Dawson",
  "Dawson_Creek", "Fort_Nelson", "Iqaluit", "Rankin_Inlet", "Resolute",
  "Cambridge_Bay", "Inuvik", "Swift_Current", "Atikokan", "Creston",
  "Blanc-Sablon", "Nipigon", "Thunder_Bay", "Rainy_River", "Yellowknife",
  "Pangnirtung",
]);

const timeZoneToCurrency = (timeZone?: string): Currency | null => {
  if (!timeZone) return null;
  const [area, city = ""] = timeZone.split("/");
  if (
    ["Europe/London", "Europe/Belfast", "Europe/Guernsey", "Europe/Jersey", "Europe/Isle_of_Man"].includes(timeZone)
  )
    return "GBP";
  if (area === "Australia") return "AUD";
  if (area === "Canada" || (area === "America" && CANADA_ZONES.has(city))) return "CAD";
  if (area === "Europe" && EUR_ZONES.has(city)) return "EUR";
  if (timeZone === "Atlantic/Madeira" || timeZone === "Atlantic/Canary" || timeZone === "Atlantic/Azores")
    return "EUR";
  return null;
};

/** Best guess at the visitor's currency; USD when nothing matches. Browser-only. */
export const detectCurrency = (): Currency => {
  if (typeof window === "undefined") return "USD";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isCurrency(saved)) return normalizeCurrency(saved);
  } catch {
    // Storage can be blocked; fall through to detection.
  }
  try {
    const fromZone = timeZoneToCurrency(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (fromZone) return fromZone;
  } catch {
    // Older browsers without Intl time zone support.
  }
  for (const locale of navigator.languages || [navigator.language]) {
    const region = locale?.split(/[-_]/)[1];
    const fromLocale = regionToCurrency(region);
    if (fromLocale) return fromLocale;
  }
  return "USD";
};

export const rememberCurrency = (currency: Currency) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    // Non-essential convenience.
  }
};

/** The price a plan shows in `currency`; plans without that price stay in USD. */
export const priceIn = (plan: Priced, currency: Currency): { currency: Currency; amount: number } => {
  if (currency !== "USD") {
    const local = Number(plan.localPrices?.[currency]);
    if (Number.isFinite(local) && local > 0) return { currency, amount: local };
  }
  return { currency: "USD", amount: Number(plan.price) };
};

export const formatPrice = (amount: number, currency: Currency | string = "USD") => {
  const code = normalizeCurrency(currency);
  try {
    // en-US renders $6.99, £6.99, €7.99, CA$9.99, A$9.99.
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
};
