import { colors } from '@/constants/colors';
import { FontAwesome } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface WordCardProps {
  word: string;
  translation: string;
  tags?: string[];
  onSpeakPress?: () => void;
  onDelete?: () => void;
}

export function WordCard({ word, translation, tags, onSpeakPress, onDelete }: WordCardProps) {
  return (
    <View style={styles.wordCard}>
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.wordText}>{word}</Text>
          <Text style={styles.translationText}>{translation}</Text>
          {tags && tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.actionsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.speakerButton,
              pressed && styles.buttonPressed
            ]}
            onPress={onSpeakPress}
          >
            <FontAwesome name="volume-up" size={20} color={colors.secondary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.deleteButton,
              pressed && styles.buttonPressed
            ]}
            onPress={onDelete}
          >
            <FontAwesome name="trash" size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wordCard: {
    backgroundColor: colors.background,
    padding: 16,
    marginVertical: 6,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  wordText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 4,
  },
  translationText: {
    fontSize: 15,
    color: colors.grayDark,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tag: {
    backgroundColor: colors.secondary,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  tagText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  speakerButton: {
    backgroundColor: "#e6f4f8",
  },
  deleteButton: {
    backgroundColor: "#fff0f0",
  },
  buttonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.92 }],
  },
});
