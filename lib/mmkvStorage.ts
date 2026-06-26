// ▶ MMKV — stockage natif synchrone, plus rapide qu'AsyncStorage. Nécessite un
// rebuild natif (dev client) pour être actif — pas utilisable depuis Expo Go.
// Décommenter ce fichier (et l'import correspondant dans chaque store) une
// fois le rebuild fait.
//
// import { MMKV } from 'react-native-mmkv';
// import type { StateStorage } from 'zustand/middleware';
//
// const mmkv = new MMKV({ id: 'actio' });
//
// export const mmkvStorage: StateStorage = {
//   getItem:    (name)        => mmkv.getString(name) ?? null,
//   setItem:    (name, value) => mmkv.set(name, value),
//   removeItem: (name)        => mmkv.delete(name),
// };
