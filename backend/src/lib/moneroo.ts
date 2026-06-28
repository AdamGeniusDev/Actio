import { createHmac, timingSafeEqual } from "node:crypto";

import env from "@/lib/env";

const MONEROO_API_BASE = "https://api.moneroo.io/v1";

// HMAC-SHA256 du corps brut, comparé en temps constant (X-Moneroo-Signature).
export function verifyMonerooSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", env.MONEROO_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signatureHeader, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

interface MonerooPaymentInitResult {
  checkoutUrl: string;
  paymentId: string;
}

// Vérifie le chemin "/payments/initialize" dans la doc Moneroo avant prod —
// l'API peut évoluer depuis l'écriture de ce fichier.
export async function initiateProCheckout(params: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  amount: number;
  currency: string;
  returnUrl: string;
  methods?: string[]; // shortcodes Moneroo, ex: "card_usd" — vide = tous
}): Promise<MonerooPaymentInitResult> {
  const response = await fetch(`${MONEROO_API_BASE}/payments/initialize`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.MONEROO_API_KEY}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      description: "Actio Pro — abonnement",
      return_url: params.returnUrl,
      customer: { email: params.email, first_name: params.firstName, last_name: params.lastName },
      metadata: { userId: params.userId },
      ...(params.methods ? { methods: params.methods } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Moneroo a refusé la création du paiement (${response.status})`);
  }

  const body = await response.json() as { data?: { checkout_url?: string; id?: string } };
  if (!body.data?.checkout_url || !body.data.id) {
    throw new Error("Réponse Moneroo inattendue : checkout_url ou id manquant");
  }

  return { checkoutUrl: body.data.checkout_url, paymentId: body.data.id };
}
