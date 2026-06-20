import { colors } from '@/constants/colors';
import { FontAwesome } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

export default function GameCard({ title, description, icon, color, onPress }: GameCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.gameCard,
        pressed && styles.gameCardPressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <FontAwesome name={icon as any} size={32} color={colors.white} />
      </View>
      <Text style={styles.gameTitle}>{title}</Text>
      <Text style={styles.gameDescription}>{description}</Text>
      <View style={[styles.playBadge, { backgroundColor: color + '18' }]}>
        <FontAwesome name="play" size={10} color={color} style={{ marginRight: 4 }} />
        <Text style={[styles.playBadgeText, { color }]}>Jugar</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gameCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 22,
    minHeight: 210,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gameCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  gameDescription: {
    fontSize: 12,
    color: colors.grayDark,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  playBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
