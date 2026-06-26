import { memo } from 'react';
import type { ScrollViewProps as RNScrollViewProps } from 'react-native';
import {
  SCROLLABLE_TYPE,
  createBottomSheetScrollableComponent,
  type BottomSheetScrollViewMethods,
} from '@gorhom/bottom-sheet';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';

/**
 * Pont entre @gorhom/bottom-sheet et react-native-keyboard-controller.
 *
 * En edge-to-edge (KeyboardProvider au root), la gestion clavier native de gorhom
 * est désactivée. La solution documentée par les deux libs : utiliser le
 * KeyboardAwareScrollView de keyboard-controller (qui gère le clavier en
 * edge-to-edge via les frames natives), enveloppé dans le HOC
 * createBottomSheetScrollableComponent de gorhom pour rester un scrollable
 * compatible sheet (gestes de drag, etc.).
 *
 * Source : discussion #309 de react-native-keyboard-controller
 * (solution de @Streudal, validée par le mainteneur @kirillzyusko).
 *
 * NB : BottomSheetScrollViewProps n'est pas exporté de façon stable selon la
 * version de gorhom (parfois racine, parfois chemin profond /src ou /lib). On
 * ne l'importe donc PAS ; on compose le type public à partir des props
 * ScrollView RN + les méthodes/props clavier, ce qui suffit en pratique.
 */
type KeyboardAwareScrollViewExtraProps = {
  /** Distance entre le clavier et le TextInput focalisé. Défaut 0. */
  bottomOffset?: number;
  /** Empêche le scroll auto quand le clavier se cache. Défaut false. */
  disableScrollOnKeyboardHide?: boolean;
  /** Active/désactive cette instance. Défaut true. */
  enabled?: boolean;
};

const AnimatedKeyboardAwareScrollView =
  Animated.createAnimatedComponent(KeyboardAwareScrollView);

const BottomSheetScrollableComponent = createBottomSheetScrollableComponent<
  BottomSheetScrollViewMethods,
  any
>(SCROLLABLE_TYPE.SCROLLVIEW, AnimatedKeyboardAwareScrollView as any);

const Memoized = memo(BottomSheetScrollableComponent);
Memoized.displayName = 'BottomSheetKeyboardAwareScrollView';

// Type public : props ScrollView RN + props clavier. On évite de dépendre de
// BottomSheetScrollViewProps (export instable selon la version de gorhom).
export const BottomSheetKeyboardAwareScrollView = Memoized as unknown as React.FC<
  RNScrollViewProps & KeyboardAwareScrollViewExtraProps & { children?: React.ReactNode }
>;