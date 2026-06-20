import { colors } from '@/constants/colors';
import { deleteWord, getUserWords } from "@/services/wordService";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  useEffect(() => {
    loadWords();
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
    Speech.speak(word, {
      language: 'en-UK',
      pitch: 1.0,
      rate: 0.6,
    });
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

  const renderWord = ({ item }: { item: Word }) => (
    <WordCard
      word={item.word}
      translation={item.translation}
      tags={item.tags}
      onSpeakPress={() => handleSpeak(item.word)}
      onDelete={() => handleDeleteWord(item.id, item.word)}
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
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {loadingWords ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : words.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('@/assets/images/AlexTriste.png')}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>No hay palabras guardadas todavía.</Text>
          <Text style={styles.emptySubText}>Pulsa el botón + para añadir tu primera palabra</Text>
        </View>
      ) : filteredWords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('@/assets/images/AlexTriste.png')}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>No se encontraron palabras</Text>
          <Text style={styles.emptySubText}>No hay resultados para "{searchQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWords}
          renderItem={renderWord}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <FontAwesome name="plus" size={24} color={colors.white} />
      </TouchableOpacity>

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
    backgroundColor: colors.white,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
