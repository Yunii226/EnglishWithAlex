import { colors } from '@/constants/colors';
import { saveGameResult } from "@/services/statsService";
import { getUserWords } from "@/services/wordService";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Word = {
  id: string;
  word: string;
  translation: string;
  tags?: string[];
};

type Card = {
  key: string;
  pairId: string;
  text: string;
  lang: 'en' | 'es';
  matched: boolean;
};

const PAIRS = 6; // 6 parejas = 12 cartas

export default function Memory() {
  const { user } = useUser();
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notEnoughWords, setNotEnoughWords] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    initialize();
  }, [user]);

  const initialize = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setGameFinished(false);
      setNotEnoughWords(false);
      setFlipped([]);
      setMatchedCount(0);
      setMoves(0);
      setBusy(false);

      const userWords = await getUserWords(user.id) as Word[];

      if (userWords.length < PAIRS) {
        setNotEnoughWords(true);
        return;
      }

      const selected = [...userWords].sort(() => Math.random() - 0.5).slice(0, PAIRS);
      const deck: Card[] = [];
      selected.forEach((w) => {
        deck.push({ key: `${w.id}-en`, pairId: w.id, text: w.word, lang: 'en', matched: false });
        deck.push({ key: `${w.id}-es`, pairId: w.id, text: w.translation, lang: 'es', matched: false });
      });
      deck.sort(() => Math.random() - 0.5);
      setCards(deck);
    } catch (error) {
      console.error("Error initializing memory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (index: number) => {
    if (busy) return;
    if (flipped.includes(index) || cards[index].matched) return;
    if (flipped.length === 0) {
      setFlipped([index]);
      return;
    }
    if (flipped.length === 1) {
      const firstIndex = flipped[0];
      const newFlipped = [firstIndex, index];
      setFlipped(newFlipped);
      setMoves(prev => prev + 1);
      setBusy(true);

      const isMatch = cards[firstIndex].pairId === cards[index].pairId;
      if (isMatch) {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === firstIndex || i === index ? { ...c, matched: true } : c)));
          const newMatched = matchedCount + 1;
          setMatchedCount(newMatched);
          setFlipped([]);
          setBusy(false);
          if (newMatched === PAIRS) finish();
        }, 550);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 900);
      }
    }
  };

  const finish = async () => {
    setGameFinished(true);
    if (user) {
      await saveGameResult(user.id, { correct: PAIRS, total: PAIRS, bestStreak: PAIRS });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={styles.loadingText}>Preparando cartas...</Text>
      </View>
    );
  }

  if (notEnoughWords) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-circle" size={64} color={colors.gray} />
        <Text style={styles.notEnoughTitle}>Palabras insuficientes</Text>
        <Text style={styles.notEnoughText}>Necesitas al menos {PAIRS} palabras para jugar a Parejas.</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.success }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver al Arcade</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameFinished) {
    // Menos movimientos = mejor. Perfecto sería PAIRS movimientos.
    const accuracy = Math.round((PAIRS / moves) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 55 ? 2 : 1;
    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{stars === 3 ? '🏆' : stars === 2 ? '🎉' : '💪'}</Text>
          <Text style={styles.resultTitle}>¡Parejas completadas!</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3].map(s => (
              <FontAwesome key={s} name="star" size={36} color={s <= stars ? colors.accent : colors.border} style={{ marginHorizontal: 4 }} />
            ))}
          </View>
          <Text style={styles.movesText}>Lo lograste en <Text style={styles.movesNumber}>{moves}</Text> intentos</Text>
          <View style={styles.xpBadge}>
            <FontAwesome name="star" size={13} color={colors.accent} />
            <Text style={styles.xpText}>+{PAIRS * 10 + 5} XP</Text>
          </View>
        </View>
        <View style={styles.resultActions}>
          <TouchableOpacity style={[styles.playAgainButton, { backgroundColor: colors.success }]} onPress={initialize}>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <FontAwesome name="check-circle" size={14} color={colors.success} />
          <Text style={styles.statPillText}>{matchedCount}/{PAIRS} parejas</Text>
        </View>
        <View style={styles.statPill}>
          <FontAwesome name="repeat" size={14} color={colors.primary} />
          <Text style={styles.statPillText}>{moves} intentos</Text>
        </View>
      </View>

      <Text style={styles.hint}>Empareja cada palabra en inglés con su traducción</Text>

      <View style={styles.grid}>
        {cards.map((card, index) => {
          const isUp = flipped.includes(index) || card.matched;
          return (
            <Pressable
              key={card.key}
              style={[
                styles.card,
                isUp && (card.lang === 'en' ? styles.cardEn : styles.cardEs),
                card.matched && styles.cardMatched,
              ]}
              onPress={() => handleCardPress(index)}
            >
              {isUp ? (
                <Text style={[styles.cardText, card.lang === 'en' ? styles.cardTextEn : styles.cardTextEs]} numberOfLines={3}>
                  {card.text}
                </Text>
              ) : (
                <FontAwesome name="question" size={26} color={colors.white} />
              )}
            </Pressable>
          );
        })}
      </View>
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
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.borderLight },
  statPillText: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  hint: { fontSize: 14, color: colors.grayDark, textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '31%',
    aspectRatio: 0.82,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cardEn: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary },
  cardEs: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.secondary },
  cardMatched: { opacity: 0.45, backgroundColor: '#ECFDF5', borderColor: colors.success },
  cardText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  cardTextEn: { color: colors.primaryDark },
  cardTextEs: { color: colors.secondary },
  resultContainer: { flex: 1, backgroundColor: colors.backgroundLight, padding: 24, justifyContent: 'center' },
  resultCard: { backgroundColor: colors.white, borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  resultEmoji: { fontSize: 64, marginBottom: 12 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, marginBottom: 20, textAlign: 'center' },
  starsRow: { flexDirection: 'row', marginBottom: 20 },
  movesText: { fontSize: 17, color: colors.grayDark, fontWeight: '500' },
  movesNumber: { fontSize: 20, fontWeight: '800', color: colors.textDark },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, backgroundColor: '#FEF3E2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  xpText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  resultActions: { marginTop: 24, gap: 12 },
  playAgainButton: { paddingVertical: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  playAgainButtonText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
  backButtonSecondary: { paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  backButtonSecondaryText: { color: colors.grayDark, fontSize: 16, fontWeight: '600' },
});
