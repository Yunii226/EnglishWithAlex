import { colors } from '@/constants/colors';
import { saveGameResult } from "@/services/statsService";
import { getUserWords } from "@/services/wordService";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

type Letter = { id: number; char: string; used: boolean };

const scrambleWord = (word: string): string[] => {
  const chars = word.split('');
  for (let attempt = 0; attempt < 10; attempt++) {
    const shuffled = [...chars].sort(() => Math.random() - 0.5);
    if (shuffled.join('') !== word) return shuffled;
  }
  return chars.reverse();
};

export default function Scramble() {
  const { user } = useUser();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notEnoughWords, setNotEnoughWords] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [pool, setPool] = useState<Letter[]>([]);
  const [slots, setSlots] = useState<Letter[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);

  useEffect(() => {
    initialize();
  }, [user]);

  const buildLetters = (word: string) => {
    const scrambled = scrambleWord(word);
    setPool(scrambled.map((char, i) => ({ id: i, char, used: false })));
    setSlots([]);
  };

  const initialize = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setGameFinished(false);
      setNotEnoughWords(false);
      setCurrentIndex(0);
      setScore(0);
      setFeedback('idle');
      streakRef.current = 0;
      bestStreakRef.current = 0;

      const userWords = await getUserWords(user.id) as Word[];

      // Solo palabras de una sola "palabra" y de longitud razonable
      const usable = userWords.filter(w => w.word.trim().length >= 3 && w.word.trim().length <= 11 && !w.word.trim().includes(' '));

      if (usable.length < 4) {
        setNotEnoughWords(true);
        return;
      }

      const selected = [...usable].sort(() => Math.random() - 0.5).slice(0, Math.min(10, usable.length));
      const qs = selected.map(w => ({ word: w.word.trim(), translation: w.translation }));
      setQuestions(qs);
      buildLetters(qs[0].word);
    } catch (error) {
      console.error("Error initializing scramble:", error);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    Speech.speak(text, { language: 'en-UK', pitch: 1.0, rate: 0.6 });
  };

  const pickLetter = (letter: Letter) => {
    if (feedback !== 'idle' || letter.used) return;
    setPool(prev => prev.map(l => (l.id === letter.id ? { ...l, used: true } : l)));
    setSlots(prev => [...prev, letter]);
  };

  const removeLetter = (letter: Letter) => {
    if (feedback !== 'idle') return;
    setSlots(prev => prev.filter(l => l.id !== letter.id));
    setPool(prev => prev.map(l => (l.id === letter.id ? { ...l, used: false } : l)));
  };

  const resetSlots = () => {
    if (feedback !== 'idle') return;
    setPool(prev => prev.map(l => ({ ...l, used: false })));
    setSlots([]);
  };

  const handleCheck = async () => {
    if (feedback !== 'idle') return;
    const current = questions[currentIndex];
    const attempt = slots.map(l => l.char).join('').toLowerCase();
    const isCorrect = attempt === current.word.toLowerCase();

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
    }

    setTimeout(async () => {
      if (currentIndex < questions.length - 1) {
        const next = currentIndex + 1;
        setCurrentIndex(next);
        setFeedback('idle');
        buildLetters(questions[next].word);
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
    }, isCorrect ? 1100 : 1900);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Mezclando letras...</Text>
      </View>
    );
  }

  if (notEnoughWords) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-circle" size={64} color={colors.gray} />
        <Text style={styles.notEnoughTitle}>Palabras insuficientes</Text>
        <Text style={styles.notEnoughText}>Necesitas al menos 4 palabras de una sola palabra (3-11 letras) para jugar a Anagrama.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
          <Text style={styles.resultTitle}>¡Anagramas resueltos!</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreTotal}>/ {questions.length}</Text>
          </View>
          <Text style={styles.scorePercentage}>{percentage}% correcto</Text>
          <View style={styles.resultProgressBar}>
            <View style={[styles.resultProgressFill, { width: `${percentage}%` as any, backgroundColor: isGood ? colors.success : colors.primary }]} />
          </View>
          <Text style={styles.resultMessage}>
            {percentage === 100 ? '¡Maestro de los anagramas!' : isGood ? '¡Buen trabajo!' : '¡Sigue practicando!'}
          </Text>
          <View style={styles.xpBadge}>
            <FontAwesome name="star" size={13} color={colors.accent} />
            <Text style={styles.xpText}>+{score * 10 + 5} XP</Text>
          </View>
        </View>
        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.playAgainButton} onPress={initialize}>
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
  const slotBorder = feedback === 'correct' ? colors.success : feedback === 'wrong' ? colors.error : colors.border;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Text style={styles.questionLabel}>Ordena las letras</Text>
        <Text style={styles.translationText}>{current.translation}</Text>
      </View>

      {/* Slots (respuesta) */}
      <View style={[styles.slotsRow, { borderColor: slotBorder }]}>
        {slots.length === 0 ? (
          <Text style={styles.slotsPlaceholder}>Toca las letras de abajo</Text>
        ) : (
          slots.map((l) => (
            <Pressable key={l.id} style={styles.slotTile} onPress={() => removeLetter(l)}>
              <Text style={styles.slotTileText}>{l.char}</Text>
            </Pressable>
          ))
        )}
      </View>

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

      {/* Pool de letras */}
      <View style={styles.poolRow}>
        {pool.map((l) => (
          <Pressable
            key={l.id}
            style={[styles.poolTile, l.used && styles.poolTileUsed]}
            onPress={() => pickLetter(l)}
            disabled={l.used || feedback !== 'idle'}
          >
            <Text style={[styles.poolTileText, l.used && styles.poolTileTextUsed]}>{l.char}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryAction} onPress={resetSlots} disabled={feedback !== 'idle'}>
          <FontAwesome name="undo" size={15} color={colors.grayDark} />
          <Text style={styles.secondaryActionText}>Reiniciar</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => speak(current.word)}>
          <FontAwesome name="volume-up" size={15} color={colors.secondary} />
          <Text style={[styles.secondaryActionText, { color: colors.secondary }]}>Pista</Text>
        </Pressable>
      </View>

      <TouchableOpacity
        style={[styles.checkButton, (slots.length !== current.word.length || feedback !== 'idle') && styles.checkButtonDisabled]}
        onPress={handleCheck}
        disabled={slots.length !== current.word.length || feedback !== 'idle'}
        activeOpacity={0.85}
      >
        <Text style={styles.checkButtonText}>Comprobar</Text>
      </TouchableOpacity>
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
  backButton: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, marginTop: 8 },
  backButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  progressContainer: { marginBottom: 20 },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 13, color: colors.grayDark, fontWeight: '500' },
  scoreLabel: { fontSize: 14, color: colors.success, fontWeight: 'bold' },
  questionCard: { backgroundColor: colors.white, borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  questionLabel: { fontSize: 13, color: colors.gray, marginBottom: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  translationText: { fontSize: 26, fontWeight: 'bold', color: colors.textDark, textAlign: 'center' },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, minHeight: 64, alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', padding: 12, marginBottom: 8 },
  slotsPlaceholder: { color: colors.gray, fontSize: 14, fontWeight: '500' },
  slotTile: { width: 42, height: 48, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  slotTileText: { color: colors.white, fontSize: 22, fontWeight: '800', textTransform: 'uppercase' },
  solutionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, marginBottom: 4 },
  solutionText: { fontSize: 15, color: colors.error, fontWeight: '600' },
  solutionWord: { fontWeight: '800', color: colors.textDark, textTransform: 'lowercase' },
  poolRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 8 },
  poolTile: { width: 46, height: 52, borderRadius: 12, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  poolTileUsed: { backgroundColor: colors.borderLight, borderColor: colors.border },
  poolTileText: { color: colors.primaryDark, fontSize: 24, fontWeight: '800', textTransform: 'uppercase' },
  poolTileTextUsed: { color: 'transparent' },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16 },
  secondaryActionText: { color: colors.grayDark, fontWeight: '700', fontSize: 14 },
  checkButton: { backgroundColor: colors.primary, paddingVertical: 17, borderRadius: 14, alignItems: 'center', marginTop: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  checkButtonDisabled: { backgroundColor: colors.gray, shadowOpacity: 0 },
  checkButtonText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
  resultContainer: { flex: 1, backgroundColor: colors.backgroundLight, padding: 24, justifyContent: 'center' },
  resultCard: { backgroundColor: colors.white, borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  resultEmoji: { fontSize: 64, marginBottom: 12 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, marginBottom: 20, textAlign: 'center' },
  scoreCircle: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  scoreNumber: { fontSize: 72, fontWeight: 'bold', color: colors.primary, lineHeight: 80 },
  scoreTotal: { fontSize: 28, color: colors.grayDark, marginLeft: 4, fontWeight: '600' },
  scorePercentage: { fontSize: 18, color: colors.grayDark, marginBottom: 20, fontWeight: '500' },
  resultProgressBar: { width: '100%', height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 20 },
  resultProgressFill: { height: '100%', borderRadius: 5 },
  resultMessage: { fontSize: 15, color: colors.grayDark, textAlign: 'center', lineHeight: 22 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: '#FEF3E2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  xpText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  resultActions: { marginTop: 24, gap: 12 },
  playAgainButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  playAgainButtonText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
  backButtonSecondary: { paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  backButtonSecondaryText: { color: colors.grayDark, fontSize: 16, fontWeight: '600' },
});
