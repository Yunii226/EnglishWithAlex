import { colors } from '@/constants/colors';
import { getUserWords } from "@/services/wordService";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Word = {
  id: string;
  word: string;
  translation: string;
  tags?: string[];
};

type Question = {
  translation: string;
  correctWord: string;
  options: string[];
};

export default function Quiz() {
  const { user } = useUser();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showingResult, setShowingResult] = useState(false);

  useEffect(() => {
    initializeQuiz();
  }, [user]);

  const initializeQuiz = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userWords = await getUserWords(user.id) as Word[];

      if (userWords.length < 4) {
        Alert.alert(
          "Palabras insuficientes",
          "Necesitas al menos 4 palabras para jugar. Añade más palabras primero.",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      // Elegir 10 palabras aleatorias, -0.5 sirve para mezclar el array, si sale negativo va antes, si sale positivo va después
      const shuffledWords = [...userWords].sort(() => Math.random() - 0.5);
      const selectedWords = shuffledWords.slice(0, Math.min(10, userWords.length));

      // Generar las preguntas
      const generatedQuestions: Question[] = selectedWords.map((word) => {
        // Coge 3 respuestas aleatorias incorrectas
        const wrongAnswers = userWords
          // Filtra para no coger la palabra actual, mezcla el array, coge las 3 primeras y sus palabras en inglés
          .filter(w => w.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.word);

        // Junta la respuesta correcta con las incorrectas y mezcla el array
        const options = [...wrongAnswers, word.word].sort(() => Math.random() - 0.5);

        return {
          translation: word.translation,
          correctWord: word.word,
          options,
        };
      });

      // Guarda las preguntas y resetea el estado del juego
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
    } catch (error) {
      console.error("Error initializing quiz:", error);
      Alert.alert("Error", "No se pudo iniciar el juego");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la selección de una opción
  const handleOptionPress = (option: string) => {
    if (selectedOption !== null) return;

    setSelectedOption(option);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correctWord;

    if (isCorrect) {
      setScore(score + 1);
    }

    // Esperar un poco para que se vea el resultado
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
      } else {
        // Mostrar resultado final
        setShowingResult(true);
        setTimeout(() => {
          Alert.alert(
            "¡Quiz Completado!",
            // Con ` se pueden poner variables en el mensaje
            `Has acertado ${isCorrect ? score + 1 : score} de ${questions.length} preguntas`,
            [
              {
                text: "Volver",
                onPress: () => router.back(),
              },
            ]
          );
        }, 500);
      }
    }, 1000);
  };

  // Función para obtener el estilo de las opciones según si están seleccionadas, si son correctas o incorrectas
  const getOptionStyle = (option: string) => {
    if (selectedOption === null) {
      return styles.option;
    }

    const currentQuestion = questions[currentQuestionIndex];
    
    if (option === currentQuestion.correctWord) {
      return [styles.option, styles.optionCorrect];
    }
    
    if (option === selectedOption && option !== currentQuestion.correctWord) {
      return [styles.option, styles.optionWrong];
    }

    return [styles.option, styles.optionDisabled];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No se pudieron cargar las preguntas</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>
          Pregunta {currentQuestionIndex + 1} / {questions.length}
        </Text>
        <Text style={styles.scoreText}>Aciertos: {score}</Text>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>Traducción:</Text>
        <Text style={styles.questionText}>{currentQuestion.translation}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              getOptionStyle(option),
              pressed && selectedOption === null && styles.optionPressed
            ]}
            onPress={() => handleOptionPress(option)}
            disabled={selectedOption !== null}
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  errorText: {
    fontSize: 16,
    color: colors.grayDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  questionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionLabel: {
    fontSize: 14,
    color: colors.grayDark,
    marginBottom: 8,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionPressed: {
    backgroundColor: colors.border,
    transform: [{ scale: 0.98 }],
  },
  optionCorrect: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  optionWrong: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
});
