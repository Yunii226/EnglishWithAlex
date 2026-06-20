import { colors } from '@/constants/colors';
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  gradientColors?: string[];
  onPress?: () => void;
}

export default function GameCard({ title, description, icon, color, gradientColors, onPress }: GameCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50 }),
      Animated.timing(shadowAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }),
      Animated.timing(shadowAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const gradient = gradientColors ?? [color, color + 'BB'];

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.gameCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <FontAwesome name={icon as any} size={30} color={colors.white} />
        </LinearGradient>
        <Text style={styles.gameTitle}>{title}</Text>
        <Text style={styles.gameDescription}>{description}</Text>
        <View style={[styles.playBadge, { backgroundColor: color + '18' }]}>
          <FontAwesome name="play" size={9} color={color} style={{ marginRight: 5 }} />
          <Text style={[styles.playBadgeText, { color }]}>Jugar ahora</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gameCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 22,
    minHeight: 210,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F6EF7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconContainer: {
    width: 74,
    height: 74,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  gameTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  gameDescription: {
    fontSize: 13,
    color: colors.grayDark,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  playBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
