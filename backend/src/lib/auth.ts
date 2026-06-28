import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, openAPI } from "better-auth/plugins";

import db from "@/drizzle";
import schema from "@/drizzle/schema";
import env from "./env";
import sendEmail from "./send-email";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.PUBLIC_BASE_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // SECURITY NOTE: repasser à true avant la mise en prod publique — sinon
    // un compte peut être créé avec l'email de quelqu'un d'autre sans preuve.
    requireEmailVerification: false,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Vérifiez votre adresse email — Actio",
        `Bienvenue sur Actio ! Vérifiez votre email en suivant ce lien (valide 24h) : ${url}`,
      );
    },
  },
  // clientId : tableau (un par plateforme) — l'app mobile utilise le flux ID
  // token natif plutôt que la redirection OAuth navigateur.
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  // bearer() : React Native n'a pas de cookie jar — accepte aussi
  // Authorization: Bearer <token>, renouvelé via l'en-tête set-auth-token.
  plugins: [bearer(), openAPI()],
});
