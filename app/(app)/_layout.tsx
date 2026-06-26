import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import {
  Home,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';

import { TaskCreationSheet } from '@/components/tasks/TaskCreationSheet';
import { Shadows, Gradients } from '@/constants/theme';
import { useUIStore } from '@/stores/ui.store';

// ─── Icône standard (Home / Semaine / Stats / Réglages) ───────────────────────
// Pas de label (façon Instagram) : les icônes seules suffisent, et ça évite
// tout problème de troncature peu importe la langue (FR/EN).

interface TabBarIconProps {
  focused: boolean;
  icon:    LucideIcon;
}

function TabBarIcon({ focused, icon: Icon }: TabBarIconProps) {
  const color = focused ? '#FF6B1A' : '#4A6480';

  return (
    <View className="items-center justify-center">
      <Icon size={24} color={color} strokeWidth={focused ? 2.4 : 1.8} />
    </View>
  );
}

function NoRippleTabButton({ ref, ...props }: any) {
  return <Pressable {...props} android_ripple={{ color: 'transparent' }} />;
}

// ─── Bouton central "+" (relevé, anneau pour le détacher du fond) ─────────────

const FAB_SIZE = 58;
const FAB_LIFT = 32;

function CreateTabIcon() {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.08, { duration: 220, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[aStyle, { marginTop: -FAB_LIFT }]}>
      <View
        style={[
          {
            width: FAB_SIZE + 8,
            height: FAB_SIZE + 8,
            borderRadius: (FAB_SIZE + 8) / 2,
            backgroundColor: '#080D14',
            alignItems: 'center',
            justifyContent: 'center',
          },
          Shadows.fab,
        ]}
      >
        <LinearGradient
          {...Gradients.accent}
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={26} color="#FFFFFF" strokeWidth={2.6} />
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────

export default function AppLayout() {
  const openTaskSheet = useUIStore((s) => s.openTaskSheet);

  return (
    <View style={{ flex: 1, backgroundColor: '#080D14' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIconStyle: { height: '100%' },
          tabBarItemStyle: {
            paddingVertical: 0,
            paddingHorizontal: 0,
          },
          tabBarStyle: {
            height: 68,
            backgroundColor: '#121E2E',
            borderTopWidth: 0,
            borderTopColor: 'transparent',
            paddingBottom: 0,
            overflow: 'visible',
            ...Shadows.tabBar,
          },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon={Home} />,
            tabBarButton: (props) => <NoRippleTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="(planning)"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon={Calendar} />,
            tabBarButton: (props) => <NoRippleTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            tabBarIcon: () => <CreateTabIcon />,
            tabBarButton: ({ ref, ...props }) => (
              <Pressable
                {...props}
                android_ripple={{ color: 'transparent' }}
                onPress={() => openTaskSheet()}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon={BarChart3} />,
            tabBarButton: (props) => <NoRippleTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="(settings)"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon={Settings} />,
            tabBarButton: (props) => <NoRippleTabButton {...props} />,
          }}
        />
      </Tabs>

      <TaskCreationSheet />
    </View>
  );
}