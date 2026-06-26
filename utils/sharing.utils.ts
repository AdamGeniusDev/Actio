import { Share, Linking, Alert } from 'react-native';

// Pas encore de fiche store publiée — le message de partage reste donc
// textuel (sans lien), à enrichir avec l'URL App Store/Play Store une fois
// l'app publiée.
export async function shareApp(): Promise<void> {
  try {
    await Share.share({
      message: 'Je teste ACTIO, une app qui m\'aide à tenir mes engagements grâce à des garants qui me tiennent responsable. 👀',
    });
  } catch {
    // Annulation ou échec silencieux du partage natif — rien à faire.
  }
}

// Linking.canOpenURL('mailto:...') est connu pour renvoyer false sur Android
// même quand Gmail est installé (restrictions de visibilité des paquets,
// API 30+) — on appelle openURL directement plutôt que de se fier à ce
// pré-check peu fiable, et on ne montre l'alerte de repli que si l'ouverture
// échoue réellement.
export async function contactSupport(email: string): Promise<void> {
  try {
    await Linking.openURL(`mailto:${email}`);
  } catch {
    Alert.alert('Contact', email);
  }
}
