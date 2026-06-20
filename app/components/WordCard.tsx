import { colors } from '@/constants/colors';
import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface WordCardProps {
  word: string;
  translation: string;
  tags?: string[];
  onSpeakPress?: () => void;
  onDelete?: () => void;
  index?: number;
}

export function WordCard({ word, translation, tags, onSpeakPress, onDelete, index = 0 }: WordCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const speakScale = useRef(new Animated.Value(1)).current;
  const deleteScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 60,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  }, []);

  const animatePress = (scaleRef: Animated.Value) => {
    Animated.sequence([
      Animated.spring(scaleRef, { toValue: 0.82, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleRef, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.wordCard}>
        <View style={styles.accentBar} />
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.wordText}>{word}</Text>
            <Text style={styles.translationText}>{translation}</Text>
            {tags && tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={styles.actionsContainer}>
            <Pressable
              onPress={() => { animatePress(speakScale); onSpeakPress?.(); }}
            >
              <Animated.View style={[styles.actionButton, styles.speakerButton, { transform: [{ scale: speakScale }] }]}>
                <FontAwesome name="volume-up" size={18} color={colors.secondary} />
              </Animated.View>
            </Pressable>
            <Pressable
              onPress={() => { animatePress(deleteScale); onDelete?.(); }}
            >
              <Animated.View style={[styles.actionButton, styles.deleteButton, { transform: [{ scale: deleteScale }] }]}>
                <FontAwesome name="trash" size={18} color={colors.error} />
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 5,
  },
  wordCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#4F6EF7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  wordText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  translationText: {
    fontSize: 14,
    color: colors.grayDark,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 2,
  },
  tag: {
    backgroundColor: colors.secondaryLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  tagText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  speakerButton: {
    backgroundColor: '#E0F6FF',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
});
