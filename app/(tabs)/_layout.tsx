import { colors } from '@/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 32,
      borderRadius: 12,
      backgroundColor: focused ? colors.primary + '18' : 'transparent',
    }}>
      <FontAwesome size={22} name={name as any} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 68,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Palabras",
          tabBarIcon: ({ color, focused }) => <TabIcon name="book" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="arcade"
        options={{
          title: "Arcade",
          tabBarIcon: ({ color, focused }) => <TabIcon name="gamepad" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => <TabIcon name="user" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
