import { colors } from '@/constants/colors';
import { deleteWord, getUserWords } from "@/services/wordService";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AddWordModal from "../components/AddWordModal";
import SearchBar from "../components/searchBar";
import { WordCard } from "../components/WordCard";

//Atributos de las palabras
type Word = {
  id: string;
  word: string;
  translation: string;
  //Las tags no son obligatorias
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
    // Si no hay usuario, no intentar cargar palabras
    if (!user) return;
    // Si hay usuario, marcar que se están cargando las palabras
    setLoadingWords(true);
    try {
      // Coger las palabras del usuario y guardarlas en el estado
      const userWords = await getUserWords(user.id);
      setWords(userWords as Word[]);
    } catch (error) {
      console.error("Error cargando palabras:", error);
    } finally {
      setLoadingWords(false);
    }
  };

  // Función para el sonido de las palabras, al darle al icono se usa Speech de expo para pronunciar la palabra en inglés
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

  //Eliminar palabra
  const handleDeleteWord = (wordId: string, wordText: string) => {
    if (!user) return;
    
    //Esto no funciona en web
    //TODO: Hacer que funcione en web también, quizás con un confirm de JavaScript
    Alert.alert(
      'Eliminar palabra',
      `¿Estás seguro de que quieres eliminar "${wordText}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWord(user.id, wordId);
              setWords(prevWords => prevWords.filter(w => w.id !== wordId));
              Alert.alert('Éxito', 'Palabra eliminada correctamente');
            } catch (error) {
              console.error("Error eliminando palabra:", error);
              Alert.alert('Error', 'No se pudo eliminar la palabra');
            }
          },
        },
      ]
    );
  };

  // Función para renderizar cada palabra en la lista
  const renderWord = ({ item }: { item: Word }) => (
    <WordCard
      word={item.word}
      translation={item.translation}
      tags={item.tags}
      onSpeakPress={() => handleSpeak(item.word)}
      onDelete={() => handleDeleteWord(item.id, item.word)}
    />
  );

  // Filtrar palabras basándose en la búsqueda
  const filteredWords = words.filter(word => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      word.word.toLowerCase().includes(query) ||
      word.translation.toLowerCase().includes(query) ||
      word.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Contenido de la pantalla principal
  return (
    <View style={styles.container}>
      {/* Barra para buscar las palabras */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Mostrar loading, mensaje de lista vacía o lista de palabras */}
      {loadingWords ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : words.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay palabras guardadas todavía.</Text>
          <Image 
            source={require('@/assets/images/AlexTriste.png')} 
            style={styles.emptyImage}
          />
        </View>
      ) : filteredWords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No se encontraron palabras con "{searchQuery}"</Text>
          <Image 
            source={require('@/assets/images/AlexTriste.png')} 
            style={styles.emptyImage}
          />
        </View>
      ) : (
        /* Lista de palabras filtrada */
        <FlatList
          data={filteredWords}
          renderItem={renderWord}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Botón flotante para añadir nueva palabra */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <FontAwesome name="plus" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Modal para añadir nueva palabra */}
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


// Estilos para la pantalla principal
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  list: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 80, // Espacio para el boton flotante
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 400,
    height: 400,
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
    marginBottom: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
