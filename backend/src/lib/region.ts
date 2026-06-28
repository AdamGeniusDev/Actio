import env from "@/lib/env";

// countryCode vient du client (locale de l'appareil) — heuristique de
// routage, pas une donnée de sécurité.
export type PaymentProvider = "moneroo" | "lemonsqueezy";

// Pays couverts par Moneroo (Afrique) — cf. docs Moneroo "Available-methods".
const MONEROO_COUNTRIES = new Set([
  "BJ", "BF", "CI", "GW", "ML", "NE", "SN", "TG",
  "CM", "CF", "CG", "GA", "GQ", "TD",
  "NG", "GH", "KE", "TZ", "UG", "RW", "ZM", "MW", "GN", "CD", "ZA",
]);

export function resolvePaymentProvider(countryCode: string | undefined): PaymentProvider {
  // LemonSqueezy non configuré → tout le monde sur Moneroo plutôt qu'un 500.
  if (!env.LEMONSQUEEZY_API_KEY || !env.LEMONSQUEEZY_STORE_ID) return "moneroo";

  if (!countryCode) return "moneroo";
  return MONEROO_COUNTRIES.has(countryCode.toUpperCase()) ? "moneroo" : "lemonsqueezy";
}
