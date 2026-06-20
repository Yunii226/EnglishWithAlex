import { colors } from '@/constants/colors';
import { getUserStats, levelFromXp, type UserStats } from '@/services/statsService';
import { getUserWords } from '@/services/wordService';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (user) {
        getUserStats(user.id).then(s => { if (active) setStats(s); });
        getUserWords(user.id).then(w => { if (active) setWordCount(w.length); }).catch(() => {});
      }
      return () => { active = false; };
    }, [user])
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const firstName = user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split('@')[0] ?? 'Usuario';
  const level = stats ? levelFromXp(stats.xp) : null;
  const accuracy = stats && stats.totalQuestions > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
          {level && (
            <View style={styles.levelChip}>
              <FontAwesome name="star" size={12} color={colors.white} />
              <Text style={styles.levelChipText}>Nivel {level.level} · {stats?.xp ?? 0} XP</Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.sectionTitle}>Tu progreso</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{stats?.dayStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Días de racha</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🎮</Text>
            <Text style={styles.statValue}>{stats?.gamesPlayed ?? 0}</Text>
            <Text style={styles.statLabel}>Partidas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Precisión</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>{stats?.bestStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Mejor racha</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{stats?.totalCorrect ?? 0}</Text>
            <Text style={styles.statLabel}>Aciertos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statValue}>{wordCount}</Text>
            <Text style={styles.statLabel}>Palabras</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cuenta</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 40,
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
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginTop: 12,
  },
  levelChipText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 24,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  statBox: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#4F6EF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
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
