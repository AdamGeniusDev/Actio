import env from "./env";

// API REST Resend, sans SDK. Si non configuré, logue et n'envoie rien
// plutôt que de planter (cohérent avec requireEmailVerification: false).
export default async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.warn(
      `[send-email] Resend non configuré — email à ${to} ("${subject}") non envoyé. Renseigne RESEND_API_KEY et EMAIL_FROM dans .env.`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend a refusé l'envoi de l'email (${response.status}): ${body}`);
  }
}
