import { colors } from '@/constants/colors';
import { getUserStats, levelFromXp, type UserStats } from "@/services/statsService";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import GameCard from "../components/GameCard";

export default function Arcade() {
  const router = useRouter();
  const { user } = useUser();
  const [stats, setStats] = useState<UserStats | null>(null);
  const titleAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(contentAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
  }, []);

  // Recargar estadísticas al volver a la pantalla (tras jugar)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (user) {
        getUserStats(user.id).then(s => { if (active) setStats(s); });
      }
      return () => { active = false; };
    }, [user])
  );

  const level = stats ? levelFromXp(stats.xp) : null;
  const accuracy = stats && stats.totalQuestions > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#4F6EF7', '#7B95FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.View style={{ opacity: titleAnim }}>
          <Text style={styles.headerEmoji}>🎮</Text>
          <Text style={styles.title}>Arcade</Text>
          <Text style={styles.subtitle}>Practica y mejora tu inglés</Text>
        </Animated.View>
      </LinearGradient>

      {/* Banner de progreso */}
      {stats && (
        <Animated.View style={[styles.statsBanner, { opacity: titleAnim }]}>
          <View style={styles.levelBlock}>
            <View style={styles.levelCircle}>
              <Text style={styles.levelNumber}>{level?.level}</Text>
            </View>
            <View>
              <Text style={styles.levelLabel}>Nivel</Text>
              <View style={styles.xpBarTrack}>
                <View style={[styles.xpBarFill, { width: `${level ? Math.round((level.current / level.needed) * 100) : 0}%` as any }]} />
              </View>
              <Text style={styles.xpText}>{level?.current}/{level?.needed} XP</Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>🔥 {stats.dayStreak}</Text>
              <Text style={styles.miniStatLabel}>Racha</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>🎯 {accuracy}%</Text>
              <Text style={styles.miniStatLabel}>Acierto</Text>
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View style={[styles.gamesGrid, { transform: [{ translateY: contentAnim }] }]}>
        <GameCard
          title="Quiz"
          description="Elige la palabra correcta entre 4 opciones y pon a prueba tu vocabulario."
          icon="question-circle"
          color={colors.primary}
          gradientColors={['#4F6EF7', '#7B95FF']}
          onPress={() => router.push('/(games)/quiz')}
        />
        <GameCard
          title="Listening"
          description="Escucha la pronunciación y elige la opción correcta."
          icon="headphones"
          color={colors.secondary}
          gradientColors={['#0EA5C9', '#38BDF8']}
          onPress={() => router.push('/(games)/listening')}
        />
        <GameCard
          title="Escribe"
          description="Lee la traducción y escribe la palabra en inglés. ¡Pon a prueba tu ortografía!"
          icon="pencil"
          color={colors.accent}
          gradientColors={['#F59E0B', '#FBD17A']}
          onPress={() => router.push('/(games)/spelling')}
        />
        <GameCard
          title="Parejas"
          description="Encuentra las parejas de palabra y traducción en el menor número de intentos."
          icon="clone"
          color={colors.success}
          gradientColors={['#10B981', '#34D399']}
          onPress={() => router.push('/(games)/memory')}
        />
        <GameCard
          title="Anagrama"
          description="Ordena las letras desordenadas para formar la palabra correcta en inglés."
          icon="random"
          color={colors.primaryDark}
          gradientColors={['#3350D9', '#4F6EF7']}
          onPress={() => router.push('/(games)/scramble')}
        />
      </Animated.View>

      <View style={styles.bottomSection}>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>🚀 Más juegos pronto</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 8,
  },
  headerEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#4F6EF7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  levelBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  levelCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  levelLabel: {
    fontSize: 11,
    color: colors.gray,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  xpBarTrack: {
    width: 90,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: 3,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  xpText: {
    fontSize: 10,
    color: colors.grayDark,
    fontWeight: '600',
  },
  statsDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  miniStats: {
    flexDirection: 'row',
    gap: 16,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
  },
  miniStatLabel: {
    fontSize: 11,
    color: colors.gray,
    fontWeight: '600',
    marginTop: 2,
  },
  gamesGrid: {
    padding: 20,
    gap: 16,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  comingSoonBadge: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  comingSoonText: {
    fontSize: 14,
    color: colors.grayDark,
    fontWeight: '600',
  },
});
