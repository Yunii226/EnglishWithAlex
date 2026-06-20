import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import GameCard from "../components/GameCard";

export default function Arcade() {
  const router = useRouter();
  const titleAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(contentAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
  }, []);

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
      </Animated.View>

      <View style={styles.bottomSection}>
        <Image
          source={require('@/assets/images/AlexArcade.png')}
          style={styles.image}
        />
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
  gamesGrid: {
    padding: 20,
    gap: 16,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  image: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 16,
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
