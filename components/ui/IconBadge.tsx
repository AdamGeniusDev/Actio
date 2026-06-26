import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

// Pastille icône + fond teinté de la couleur — pattern répété partout dans
// l'app (tâches, garants, réglages...) avec juste taille/rayon/couleur qui
// changent. `opacityHex` est le suffixe alpha ajouté au hex de `color` pour
// le fond (ex. '1A' ≈ 10%, '26' ≈ 15%).

interface Props {
  icon:        LucideIcon;
  color:       string;
  size?:       number;
  iconSize?:   number;
  radius?:     number;
  opacityHex?: string;
  strokeWidth?: number;
}

export function IconBadge({
  icon: Icon, color, size = 40, iconSize, radius, opacityHex = '1A', strokeWidth = 1.8,
}: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${color}${opacityHex}`,
      }}
    >
      <Icon size={iconSize ?? Math.round(size * 0.45)} color={color} strokeWidth={strokeWidth} />
    </View>
  );
}
