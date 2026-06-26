import { Platform } from 'react-native';
import type { Theme } from 'expo-router/react-navigation';

// ── Gradients ────────────────────────────────────────────────────────────────
export const Gradients = {
  accent:  { colors: ['#FF6B1A', '#FF3D00'] as const, start: { x: 0.13, y: 0 }, end: { x: 1, y: 1 } },
  hero:    { colors: ['#0F2D52', '#172436'] as const, start: { x: 0.13, y: 0 }, end: { x: 1, y: 1 } },
  danger:  { colors: ['#FF3B5C', '#CC1F3D'] as const, start: { x: 0.13, y: 0 }, end: { x: 1, y: 1 } },
  toggle:  { colors: ['#FF6B1A', '#FF3D00'] as const, start: { x: 0, y: 0 },    end: { x: 1, y: 0 } },
  success: { colors: ['#00D68F', '#00A86B'] as const, start: { x: 0, y: 0 },    end: { x: 1, y: 1 } },
} as const;

// ── Shadows ──────────────────────────────────────────────────────────────────
export const Shadows = {
  accent:  { shadowColor: '#FF6B1A', shadowOffset: { width: 0, height:  4 }, shadowOpacity: 0.4,  shadowRadius: 24, elevation:  8 },
  fab:     { shadowColor: '#FF6B1A', shadowOffset: { width: 0, height:  4 }, shadowOpacity: 0.6,  shadowRadius: 20, elevation: 12 },
  success: { shadowColor: '#00D68F', shadowOffset: { width: 0, height:  4 }, shadowOpacity: 0.4,  shadowRadius: 20, elevation:  8 },
  card:    { shadowColor: '#000000', shadowOffset: { width: 0, height:  8 }, shadowOpacity: 0.4,  shadowRadius: 32, elevation:  6 },
  tabBar:  { shadowColor: '#000000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.6,  shadowRadius: 40, elevation: 20 },
  urgent:  { shadowColor: '#FF6B1A', shadowOffset: { width: 0, height:  4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation:  6 },
  modal:   { shadowColor: '#000000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.6,  shadowRadius: 40, elevation: 24 },
} as const;

// ── Animation ────────────────────────────────────────────────────────────────
export const Animation = {
  duration: { fast: 150, normal: 300, slow: 350 },
  spring: {
    snappy: { damping: 15, stiffness: 200 },
    sheet:  { damping: 20, stiffness: 150 },
    press:  { damping: 12, stiffness: 300 },
    fab:    { damping: 10, stiffness: 180 },
    tab:    { damping: 18, stiffness: 220 },
  },
} as const;



// ── Sizes ────────────────────────────────────────────────────────────────────
export const Sizes = {
  button:      { l: 50, m: 40, s: 32 },
  input:       52,
  checkbox:    22,
  tabBar: {
    height:    64,   // hauteur de la barre
    marginH:   20,   // marge horizontale (barre flottante)
    marginB:   16,   // marge bottom
    bubble:    52,   // taille de la bulle active
    bubbleLift: 22,  // hauteur dont la bulle dépasse au-dessus de la barre
  },
  avatar:      { s: 32, m: 40, l: 56 },
  icon:        { s: 16, m: 20, l: 24, xl: 28, hero: 32, alarm: 64 },
  dragHandle:  { width: 36, height: 4 },
  progressBar: 6,
  dot:         { active: 8, inactive: 6 },
} as const;

// ── Status colors ────────────────────────────────────────────────────────────
export const Status = {
  normal:    '#FF6B1A',
  urgent:    '#FFB800',
  late:      '#FF3B5C',
  done:      '#00D68F',
  guarantor: '#4D9EFF',
} as const;

// ── Fonts ────────────────────────────────────────────────────────────────────
// Noms des fonts tels qu'enregistrés dans useFonts() du _layout.tsx
export const Fonts = {
  // Clash Display
  clashBold:     'ClashDisplay-Bold',
  // Space Grotesk
  spaceBold:     'SpaceGrotesk-Bold',
  spaceMedium:   'SpaceGrotesk-Medium',
  spaceRegular:  'SpaceGrotesk-Regular',
  // Inter
  interThin:        'Inter-Thin',
  interExtraLight:  'Inter-ExtraLight',
  interLight:       'Inter-Light',
  interRegular:     'Inter-Regular',
  interMedium:      'Inter-Medium',
  interSemiBold:    'Inter-SemiBold',
  interBold:        'Inter-Bold',
} as const;

// ── Layout ───────────────────────────────────────────────────────────────────
export const Layout = {
  // Inset à ajouter au paddingBottom des écrans pour ne pas être caché par la tab bar
  bottomTabInset:  Platform.select({ ios: 50, android: 80 }) ?? 0,
  maxContentWidth: 800,
  screenPadding:   24,
} as const;

// ── Navigation theme (expo-router) ───────────────────────────────────────────
const ACTIO_DARK: Theme = {
  dark: true,
  colors: {
    primary:      '#FF6B1A',
    background:   '#080D14',
    card:         '#121E2E',
    text:         '#F0F6FF',
    border:       '#1E3048',
    notification: '#FF6B1A',
  },
  fonts: {
    regular: { fontFamily: Fonts.interRegular,  fontWeight: '400' },
    medium:  { fontFamily: Fonts.interMedium,   fontWeight: '500' },
    bold:    { fontFamily: Fonts.interSemiBold, fontWeight: '600' },
    heavy:   { fontFamily: Fonts.interBold,     fontWeight: '700' },
  },
};

export const NAV_THEME = { light: ACTIO_DARK, dark: ACTIO_DARK };

// ── Export groupé ────────────────────────────────────────────────────────────
const Theme = { Gradients, Shadows, Animation, Sizes, Status, Fonts, Layout, NAV_THEME } as const;
export default Theme;