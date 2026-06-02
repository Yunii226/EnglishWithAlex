import { colors } from '@/constants/colors';
import { getUserWords } from "@/services/wordService";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Speech from 'expo-speech';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Word = {
    id: string;
    word: string;
    translation: string;
    tags?: string[];
};

type Question = {
    word: string;
    correctTranslation: string;
    options: string[];
};

export default function Listening() {
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

    useEffect(() => {
        // Pone el audio automáticamente
        if (questions.length > 0 && !loading) {
            playCurrentWord();
        }
    }, [currentQuestionIndex, questions, loading]);

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
                    // Filtra para no coger la palabra actual, mezcla el array, coge las 3 primeras y sus traducciones
                    .filter(w => w.id !== word.id)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3)
                    .map(w => w.translation);

                // Junta la respuesta correcta con las incorrectas y mezcla el array
                const options = [...wrongAnswers, word.translation].sort(() => Math.random() - 0.5);

                return {
                    word: word.word,
                    correctTranslation: word.translation,
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

    // Función para reproducir el audio de la palabra 
    const playCurrentWord = () => {
        if (questions.length > 0) {
            const currentQuestion = questions[currentQuestionIndex];
            Speech.speak(currentQuestion.word, {
                language: 'en-UK',
                pitch: 1.0,
                rate: 0.7,
            });
        }
    };

    // Función para manejar la selección de una opción
    const handleOptionPress = (option: string) => {
        if (selectedOption !== null) return;

        setSelectedOption(option);

        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = option === currentQuestion.correctTranslation;

        if (option === currentQuestion.correctTranslation) {
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
                        "¡Listening Completado!",
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

        if (option === currentQuestion.correctTranslation) {
            return [styles.option, styles.optionCorrect];
        }

        if (option === selectedOption && option !== currentQuestion.correctTranslation) {
            return [styles.option, styles.optionWrong];
        }

        return [styles.option, styles.optionDisabled];
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.secondary} />
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

    // Actualizar la pregunta actual
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
                <Text style={styles.questionLabel}>Escucha la palabra:</Text>
                <Pressable
                    style={({ pressed }) => [
                        styles.speakerButton,
                        pressed && styles.speakerButtonPressed
                    ]}
                    onPress={playCurrentWord}
                >
                    <FontAwesome name="volume-up" size={64} color={colors.secondary} />
                    <Text style={styles.speakerText}>Toca para escuchar</Text>
                </Pressable>
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
        color: colors.secondary,
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
        alignItems: 'center',
    },
    questionLabel: {
        fontSize: 14,
        color: colors.grayDark,
        marginBottom: 20,
        fontWeight: '600',
    },
    speakerButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    speakerButtonPressed: {
        opacity: 0.6,
        transform: [{ scale: 0.95 }],
    },
    speakerText: {
        fontSize: 16,
        color: colors.secondary,
        marginTop: 12,
        fontWeight: '600',
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
