// Module natif — nécessite un build development (pas Expo Go). Setup :
// Client ID Google (backend/ARCHITECTURE.md "SSO Google") +
// EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID + iosUrlScheme dans app.json + expo prebuild.
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

export interface GoogleIdToken {
  token: string;
  accessToken?: string;
}

// null = annulé par l'utilisateur (pas une erreur à afficher).
export async function signInWithGoogle(): Promise<GoogleIdToken | null> {
  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();

    if (result.type !== 'success' || !result.data.idToken) return null;

    // accessToken vient d'un appel séparé ; best-effort, optionnel côté serveur.
    let accessToken: string | undefined;
    try {
      const tokens = await GoogleSignin.getTokens();
      accessToken = tokens.accessToken;
    } catch {
      accessToken = undefined;
    }

    return { token: result.data.idToken, accessToken };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw error;
  }
}
