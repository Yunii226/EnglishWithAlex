import { colors } from '@/constants/colors';
import { FontAwesome } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Swipeable from 'react-native-gesture-handler/Swipeable';

interface WordCardProps {
  word: string;
  translation: string;
  tags?: string[];
  onSpeakPress?: () => void;
  onDelete?: () => void;
}

export function WordCard({ word, translation, tags, onSpeakPress, onDelete }: WordCardProps) {
  const renderRightActions = () => (
    <View style={styles.deleteContainer}>
      <Pressable 
        style={styles.deleteButton}
        onPress={onDelete}
      >
        <FontAwesome name="trash" size={24} color={colors.white} />
        <Text style={styles.deleteButtonText}>Eliminar</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
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
          <Pressable
            style={({ pressed }) => [
              styles.speakerButton,
              pressed && styles.speakerButtonPressed
            ]}
            onPress={onSpeakPress}
          >
            <FontAwesome name="volume-up" size={24} color={colors.secondary} />
          </Pressable>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  wordCard: {
    backgroundColor: colors.background,
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    fontSize: 16,
    color: colors.grayDark,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: colors.secondary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  tagText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  speakerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e6f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  speakerButtonPressed: {
    opacity: 0.6,
    backgroundColor: "#d0e8f0",
  },
  deleteContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  deleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
