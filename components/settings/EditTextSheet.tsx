import { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { Gradients } from '@/constants/theme';

interface Props {
  title: string;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  saveLabel: string;
  cancelLabel: string;
  /** Message d'erreur affiché sous le champ, si la valeur saisie est invalide */
  error?: string | null;
}

/** Handle exposé au parent — mêmes noms que BottomSheetModal pour ne RIEN
 *  changer dans profile.tsx (present / dismiss). */
export interface EditTextSheetHandle {
  present: () => void;
  dismiss: () => void;
}

/**
 * Sheet d'édition d'un champ texte.
 *
 * ═══ POURQUOI UN Modal NATIF (et pas BottomSheetModal de gorhom) ═══
 *
 * Cette app est en EDGE-TO-EDGE (KeyboardProvider au root + edgeToEdgeEnabled).
 * Dans ce mode, la gestion clavier native de gorhom est désactivée, et la faire
 * cohabiter avec react-native-keyboard-controller s'est avéré ingérable
 * (double décalage, sheet qui prend tout l'écran, trou résiduel, erreurs de
 * type sur le HOC de scrollable...).
 *
 * Pour un simple champ à éditer, un Modal RN natif + KeyboardAvoidingView de
 * react-native-keyboard-controller (qui, LUI, gère le clavier proprement en
 * edge-to-edge) est radicalement plus simple et 100% prévisible :
 *   - le panneau est ancré en bas (justify-end)
 *   - KeyboardAvoidingView le pousse pile au-dessus du clavier à l'ouverture
 *   - et le redescend exactement à sa place à la fermeture (réversible)
 *
 * On perd le geste "glisser vers le bas pour fermer" de gorhom, mais on gagne
 * un comportement clavier fiable. Le backdrop reste tappable pour fermer.
 *
 * L'API exposée (present/dismiss) est identique à BottomSheetModal, donc
 * profile.tsx n'a RIEN à changer.
 */
export const EditTextSheet = forwardRef<EditTextSheetHandle, Props>(function EditTextSheet(
  { title, placeholder, keyboardType = 'default', value, onChangeText, onSave, saveLabel, cancelLabel, error },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useImperativeHandle(ref, () => ({
    present: () => setVisible(true),
    dismiss: () => setVisible(false),
  }));

  const handleClose = useCallback(() => setVisible(false), []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop tappable */}
      <Pressable
        onPress={handleClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
      >
        {/* KeyboardAvoidingView pousse le panneau au-dessus du clavier.
            behavior="padding" + le panneau ancré en bas = remontée propre. */}
        <KeyboardAvoidingView behavior="padding">
          {/* Pressable interne sans onPress : intercepte les taps pour qu'ils
              ne ferment pas la modale quand on touche le panneau lui-même. */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#121E2E',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            }}
          >
            {/* Poignée décorative */}
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#2A4560', marginBottom: 16 }} />

            <View className="flex-row items-center justify-between mb-[16px]">
              <Text className="font-space-bold text-display-s text-text-primary">
                {title}
              </Text>
              <Pressable
                onPress={handleClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-card"
                hitSlop={8}
              >
                <X size={18} color="#8BA3BE" strokeWidth={2} />
              </Pressable>
            </View>

            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="#4A6480"
              keyboardType={keyboardType}
              autoFocus
              style={{
                backgroundColor: '#0D1520',
                borderRadius: 14,
                paddingHorizontal: 16,
                height: 52,
                fontFamily: 'Inter-Medium',
                fontSize: 15,
                color: '#F0F6FF',
                borderWidth: 1,
                borderColor: error ? '#FF3B5C' : '#1E3048',
              }}
            />

            {error ? (
              <Text className="font-inter-medium text-body-s text-danger mt-[8px]">
                {error}
              </Text>
            ) : null}

            <View className="flex-row gap-[12px] mt-[20px]">
              <Pressable
                onPress={handleClose}
                className="flex-1 h-[52px] rounded-[14px] bg-card border border-subtle items-center justify-center"
              >
                <Text className="font-inter-semibold text-body-m text-text-secondary">
                  {cancelLabel}
                </Text>
              </Pressable>
              <Pressable onPress={onSave} className="flex-1 rounded-[14px] overflow-hidden">
                <LinearGradient
                  {...Gradients.accent}
                  style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="font-inter-semibold text-body-m text-white">
                    {saveLabel}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
});