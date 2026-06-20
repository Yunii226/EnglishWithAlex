import { colors } from '@/constants/colors';
import { deleteWord, getUserWords } from "@/services/wordService";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import AddWordModal from "../components/AddWordModal";
import SearchBar from "../components/searchBar";
import { WordCard } from "../components/WordCard";

type Word = {
  id: string;
  word: string;
  translation: string;
  tags?: string[];
}

export default function Index() {
  const { user } = useUser();
  const [words, setWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const fabScale = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWords();
    Animated.parallel([
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7, delay: 400 }),
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [user]);

  const loadWords = async () => {
    if (!user) return;
    setLoadingWords(true);
    try {
      const userWords = await getUserWords(user.id);
      setWords(userWords as Word[]);
    } catch (error) {
      console.error("Error cargando palabras:", error);
    } finally {
      setLoadingWords(false);
    }
  };

  const handleSpeak = (word: string) => {
    Speech.speak(word, { language: 'en-UK', pitch: 1.0, rate: 0.6 });
  };

  const handleWordAdded = async () => {
    await loadWords();
  };

  const handleDeleteWord = (wordId: string, wordText: string) => {
    if (!user) return;

    const doDelete = async () => {
      try {
        await deleteWord(user.id, wordId);
        setWords(prevWords => prevWords.filter(w => w.id !== wordId));
      } catch (error) {
        console.error("Error eliminando palabra:", error);
        if (Platform.OS === 'web') {
          window.alert('No se pudo eliminar la palabra');
        } else {
          Alert.alert('Error', 'No se pudo eliminar la palabra');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar "${wordText}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Eliminar palabra',
        `¿Estás seguro de que quieres eliminar "${wordText}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const renderWord = ({ item, index }: { item: Word; index: number }) => (
    <WordCard
      word={item.word}
      translation={item.translation}
      tags={item.tags}
      onSpeakPress={() => handleSpeak(item.word)}
      onDelete={() => handleDeleteWord(item.id, item.word)}
      index={index}
    />
  );

  const filteredWords = words.filter(word => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      word.word.toLowerCase().includes(query) ||
      word.translation.toLowerCase().includes(query) ||
      word.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient
          colors={['#4F6EF7', '#7B95FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View>
            <Text style={styles.headerGreeting}>¡Hola! 👋</Text>
            <Text style={styles.headerTitle}>Mis Palabras</Text>
          </View>
          <View style={styles.wordCountBadge}>
            <Text style={styles.wordCountNumber}>{words.length}</Text>
            <Text style={styles.wordCountLabel}>palabras</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {loadingWords ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Cargando palabras...</Text>
        </View>
      ) : words.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image source={require('@/assets/images/AlexTriste.png')} style={styles.emptyImage} />
          <Text style={styles.emptyText}>No hay palabras guardadas todavía</Text>
          <Text style={styles.emptySubText}>Pulsa el botón + para añadir tu primera palabra</Text>
        </View>
      ) : filteredWords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image source={require('@/assets/images/AlexTriste.png')} style={styles.emptyImage} />
          <Text style={styles.emptyText}>Sin resultados</Text>
          <Text style={styles.emptySubText}>No hay palabras para "{searchQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWords}
          renderItem={renderWord}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB animado */}
      <Animated.View style={[styles.fabWrapper, { transform: [{ scale: fabScale }] }]}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => setModalVisible(true)}
        >
          <LinearGradient
            colors={['#4F6EF7', '#7B95FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <FontAwesome name="plus" size={22} color={colors.white} />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {user && (
        <AddWordModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onWordAdded={handleWordAdded}
          userId={user.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 22,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  wordCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  wordCountNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 28,
  },
  wordCountLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  list: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 20,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 30,
    right: 24,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
