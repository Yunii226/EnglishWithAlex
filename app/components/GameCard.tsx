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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gameCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  gameDescription: {
    fontSize: 13,
    color: colors.grayDark,
    textAlign: 'center',
    lineHeight: 18,
  },
});
