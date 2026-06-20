import { colors } from '@/constants/colors';
import { saveGameResult } from "@/services/statsService";
import { getUserWords } from "@/services/wordService";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Word = {
  id: string;
  word: string;
  translation: string;
  tags?: string[];
};

type Question = {
  word: string;
  translation: string;
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export default function Spelling() {
  const { user } = useUser();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notEnoughWords, setNotEnoughWords] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);

  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initialize();
  }, [user]);

  const initialize = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setGameFinished(false);
      setNotEnoughWords(false);
      setCurrentIndex(0);
      setScore(0);
      setAnswer('');
      setFeedback('idle');
      setShowHint(false);
      streakRef.current = 0;
      bestStreakRef.current = 0;

      const userWords = await getUserWords(user.id) as Word[];

      if (userWords.length < 4) {
        setNotEnoughWords(true);
        return;
      }

      const shuffled = [...userWords].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(10, userWords.length));
      setQuestions(selected.map(w => ({ word: w.word, translation: w.translation })));
    } catch (error) {
      console.error("Error initializing spelling:", error);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    Speech.speak(text, { language: 'en-UK', pitch: 1.0, rate: 0.6 });
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleCheck = async () => {
    if (feedback !== 'idle' || !answer.trim()) return;
    Keyboard.dismiss();
    const current = questions[currentIndex];
    const isCorrect = normalize(answer) === normalize(current.word);

    let newScore = score;
    if (isCorrect) {
      newScore = score + 1;
      setScore(newScore);
      setFeedback('correct');
      streakRef.current += 1;
      bestStreakRef.current = Math.max(bestStreakRef.current, streakRef.current);
      speak(current.word);
    } else {
      setFeedback('wrong');
      streakRef.current = 0;
      shake();
    }

    setTimeout(async () => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setAnswer('');
        setFeedback('idle');
        setShowHint(false);
      } else {
        setGameFinished(true);
        if (user) {
          await saveGameResult(user.id, {
            correct: newScore,
            total: questions.length,
            bestStreak: bestStreakRef.current,
          });
        }
      }
    }, isCorrect ? 1100 : 1800);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Cargando palabras...</Text>
      </View>
    );
  }

  if (notEnoughWords) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-circle" size={64} color={colors.gray} />
        <Text style={styles.notEnoughTitle}>Palabras insuficientes</Text>
        <Text style={styles.notEnoughText}>Necesitas al menos 4 palabras para jugar a Escribe.</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.accent }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver al Arcade</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    const isGood = percentage >= 70;
    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{percentage === 100 ? '🏆' : isGood ? '🎉' : '💪'}</Text>
          <Text style={styles.resultTitle}>¡Completado!</Text>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNumber, { color: colors.accent }]}>{score}</Text>
            <Text style={styles.scoreTotal}>/ {questions.length}</Text>
          </View>
          <Text style={styles.scorePercentage}>{percentage}% correcto</Text>
          <View style={styles.resultProgressBar}>
            <View style={[styles.resultProgressFill, { width: `${percentage}%` as any, backgroundColor: isGood ? colors.success : colors.accent }]} />
          </View>
          <Text style={styles.resultMessage}>
            {percentage === 100 ? '¡Ortografía perfecta!' : isGood ? '¡Muy bien escrito!' : '¡Sigue practicando la escritura!'}
          </Text>
          <View style={styles.xpBadge}>
            <FontAwesome name="star" size={13} color={colors.accent} />
            <Text style={styles.xpText}>+{score * 10 + 5} XP</Text>
          </View>
        </View>
        <View style={styles.resultActions}>
          <TouchableOpacity style={[styles.playAgainButton, { backgroundColor: colors.accent }]} onPress={initialize}>
            <FontAwesome name="refresh" size={18} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.playAgainButtonText}>Jugar de nuevo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButtonSecondary} onPress={() => router.back()}>
            <Text style={styles.backButtonSecondaryText}>Volver al Arcade</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notEnoughText}>No se pudieron cargar las palabras</Text>
      </View>
    );
  }

  const current = questions[currentIndex];
  const progress = currentIndex / questions.length;
  const inputBorder = feedback === 'correct' ? colors.success : feedback === 'wrong' ? colors.error : colors.border;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>Palabra {currentIndex + 1} de {questions.length}</Text>
          <Text style={styles.scoreLabel}>✓ {score}</Text>
        </View>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>Escribe en inglés</Text>
        <Text style={styles.translationText}>{current.translation}</Text>
        {showHint && (
          <Text style={styles.hintText}>
            Empieza por “{current.word[0]}” · {current.word.length} letras
          </Text>
        )}
      </View>

      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <TextInput
          style={[styles.input, { borderColor: inputBorder }]}
          placeholder="Tu respuesta..."
          placeholderTextColor={colors.gray}
          value={answer}
          onChangeText={setAnswer}
          autoCapitalize="none"
          autoCorrect={false}
          editable={feedback === 'idle'}
          onSubmitEditing={handleCheck}
          returnKeyType="done"
        />
      </Animated.View>

      {feedback === 'wrong' && (
        <View style={styles.solutionRow}>
          <FontAwesome name="lightbulb-o" size={15} color={colors.error} />
          <Text style={styles.solutionText}>Correcto: <Text style={styles.solutionWord}>{current.word}</Text></Text>
        </View>
      )}
      {feedback === 'correct' && (
        <View style={styles.solutionRow}>
          <FontAwesome name="check-circle" size={15} color={colors.success} />
          <Text style={[styles.solutionText, { color: colors.success }]}>¡Correcto!</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <Pressable style={styles.hintButton} onPress={() => setShowHint(true)} disabled={showHint || feedback !== 'idle'}>
          <FontAwesome name="lightbulb-o" size={16} color={showHint ? colors.gray : colors.accent} />
          <Text style={[styles.hintButtonText, showHint && { color: colors.gray }]}>Pista</Text>
        </Pressable>
        <Pressable style={styles.listenButton} onPress={() => speak(current.word)}>
          <FontAwesome name="volume-up" size={16} color={colors.secondary} />
          <Text style={styles.listenButtonText}>Escuchar</Text>
        </Pressable>
      </View>

      <TouchableOpacity
        style={[styles.checkButton, (!answer.trim() || feedback !== 'idle') && styles.checkButtonDisabled]}
        onPress={handleCheck}
        disabled={!answer.trim() || feedback !== 'idle'}
        activeOpacity={0.85}
      >
        <Text style={styles.checkButtonText}>Comprobar</Text>
      </TouchableOpacity>

      {Platform.OS !== 'web' && <View style={{ height: 60 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: 20, paddingTop: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundLight, gap: 16 },
  loadingText: { fontSize: 16, color: colors.grayDark },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundLight, padding: 32, gap: 16 },
  notEnoughTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, textAlign: 'center', marginTop: 12 },
  notEnoughText: { fontSize: 16, color: colors.grayDark, textAlign: 'center', lineHeight: 24 },
  backButton: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, marginTop: 8 },
  backButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  progressContainer: { marginBottom: 20 },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 13, color: colors.grayDark, fontWeight: '500' },
  scoreLabel: { fontSize: 14, color: colors.success, fontWeight: 'bold' },
  questionCard: { backgroundColor: colors.white, borderRadius: 16, padding: 28, marginBottom: 20, alignItems: 'center', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  questionLabel: { fontSize: 13, color: colors.gray, marginBottom: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  translationText: { fontSize: 30, fontWeight: 'bold', color: colors.textDark, textAlign: 'center' },
  hintText: { fontSize: 14, color: colors.accent, marginTop: 14, fontWeight: '600' },
  input: { backgroundColor: colors.white, borderRadius: 14, padding: 18, fontSize: 20, fontWeight: '600', color: colors.textDark, borderWidth: 2, textAlign: 'center' },
  solutionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  solutionText: { fontSize: 15, color: colors.error, fontWeight: '600' },
  solutionWord: { fontWeight: '800', color: colors.textDark },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 20 },
  hintButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#FEF3E2', borderWidth: 1, borderColor: '#FDE3BC' },
  hintButtonText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  listenButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, backgroundColor: colors.secondaryLight, borderWidth: 1, borderColor: '#C7ECF7' },
  listenButtonText: { color: colors.secondary, fontWeight: '700', fontSize: 14 },
  checkButton: { backgroundColor: colors.accent, paddingVertical: 17, borderRadius: 14, alignItems: 'center', marginTop: 24, shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  checkButtonDisabled: { backgroundColor: colors.gray, shadowOpacity: 0 },
  checkButtonText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
  resultContainer: { flex: 1, backgroundColor: colors.backgroundLight, padding: 24, justifyContent: 'center' },
  resultCard: { backgroundColor: colors.white, borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  resultEmoji: { fontSize: 64, marginBottom: 12 },
  resultTitle: { fontSize: 26, fontWeight: 'bold', color: colors.textDark, marginBottom: 24 },
  scoreCircle: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  scoreNumber: { fontSize: 72, fontWeight: 'bold', lineHeight: 80 },
  scoreTotal: { fontSize: 28, color: colors.grayDark, marginLeft: 4, fontWeight: '600' },
  scorePercentage: { fontSize: 18, color: colors.grayDark, marginBottom: 20, fontWeight: '500' },
  resultProgressBar: { width: '100%', height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 20 },
  resultProgressFill: { height: '100%', borderRadius: 5 },
  resultMessage: { fontSize: 15, color: colors.grayDark, textAlign: 'center', lineHeight: 22 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: '#FEF3E2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  xpText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  resultActions: { marginTop: 24, gap: 12 },
  playAgainButton: { paddingVertical: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  playAgainButtonText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
  backButtonSecondary: { paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  backButtonSecondaryText: { color: colors.grayDark, fontSize: 16, fontWeight: '600' },
});
