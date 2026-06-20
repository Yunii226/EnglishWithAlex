import { colors } from '@/constants/colors';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const firstName = user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split('@')[0] ?? 'Usuario';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F6EF7', '#7B95FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.avatarWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Image source={require('@/assets/images/Alex.png')} style={styles.avatar} />
            </View>
          </View>
          <Text style={styles.name}>{firstName}</Text>
          <Text style={styles.email}>{user?.emailAddresses[0]?.emailAddress}</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.infoCard}>
          <FontAwesome name="envelope-o" size={18} color={colors.primary} />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Correo electrónico</Text>
            <Text style={styles.infoValue}>{user?.emailAddresses[0]?.emailAddress}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <FontAwesome name="user-o" size={18} color={colors.secondary} />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Usuario</Text>
            <Text style={styles.infoValue}>{firstName}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#EF4444', '#F87171']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signOutGradient}
          >
            <FontAwesome name="sign-out" size={18} color={colors.white} style={styles.icon} />
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatarRing: {
    padding: 4,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  content: {
    padding: 24,
    gap: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  signOutGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  signOutText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
