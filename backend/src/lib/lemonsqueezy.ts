import { createHmac, timingSafeEqual } from "node:crypto";

import env from "@/lib/env";

const LEMONSQUEEZY_API_BASE = "https://api.lemonsqueezy.com/v1";

// HMAC-SHA256 hex du corps brut (header X-Signature), comparé en temps constant.
export function verifyLemonSqueezySignature(rawBody: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader || !env.LEMONSQUEEZY_WEBHOOK_SECRET) return false;

  const expected = createHmac("sha256", env.LEMONSQUEEZY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signatureHeader, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

interface LemonSqueezyCheckoutResult {
  checkoutUrl: string;
  checkoutId: string;
}

// Format JSON:API (confirmé via le SDK officiel lemonsqueezy.js). Le
// renouvellement est géré par LemonSqueezy lui-même, via webhook.
export async function createLemonSqueezyCheckout(params: {
  userId: string;
  email: string;
  returnUrl: string;
  billingPeriod: "monthly" | "yearly";
}): Promise<LemonSqueezyCheckoutResult> {
  const variantId = params.billingPeriod === "yearly"
    ? env.LEMONSQUEEZY_VARIANT_ID_YEARLY
    : env.LEMONSQUEEZY_VARIANT_ID_MONTHLY;

  if (!env.LEMONSQUEEZY_API_KEY || !env.LEMONSQUEEZY_STORE_ID || !variantId) {
    throw new Error("LemonSqueezy n'est pas configuré (API_KEY / STORE_ID / VARIANT_ID manquant)");
  }

  const response = await fetch(`${LEMONSQUEEZY_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      "content-type": "application/vnd.api+json",
      accept: "application/vnd.api+json",
      authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: { redirect_url: params.returnUrl },
          checkout_data: {
            email: params.email,
            custom: { user_id: params.userId }, // écho dans meta.custom_data du webhook
          },
        },
        relationships: {
          store: { data: { type: "stores", id: env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LemonSqueezy a refusé la création du checkout (${response.status}): ${body}`);
  }

  const result = await response.json() as { data?: { id?: string; attributes?: { url?: string } } };
  if (!result.data?.attributes?.url || !result.data.id) {
    throw new Error("Réponse LemonSqueezy inattendue : url ou id manquant");
  }

  return { checkoutUrl: result.data.attributes.url, checkoutId: result.data.id };
}
