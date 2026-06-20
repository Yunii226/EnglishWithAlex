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
    const [gameFinished, setGameFinished] = useState(false);
    const [notEnoughWords, setNotEnoughWords] = useState(false);
    const streakRef = useRef(0);
    const bestStreakRef = useRef(0);

    useEffect(() => {
        initializeQuiz();
    }, [user]);

    useEffect(() => {
        if (questions.length > 0 && !loading && !gameFinished) {
            playCurrentWord();
        }
    }, [currentQuestionIndex, questions, loading]);

    const initializeQuiz = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setGameFinished(false);
            setNotEnoughWords(false);
            setSelectedOption(null);
            setCurrentQuestionIndex(0);
            setScore(0);
            streakRef.current = 0;
            bestStreakRef.current = 0;

            const userWords = await getUserWords(user.id) as Word[];

            if (userWords.length < 4) {
                setNotEnoughWords(true);
                return;
            }

            const shuffledWords = [...userWords].sort(() => Math.random() - 0.5);
            const selectedWords = shuffledWords.slice(0, Math.min(10, userWords.length));

            const generatedQuestions: Question[] = selectedWords.map((word) => {
                const wrongAnswers = userWords
                    .filter(w => w.id !== word.id)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3)
                    .map(w => w.translation);

                const options = [...wrongAnswers, word.translation].sort(() => Math.random() - 0.5);

                return {
                    word: word.word,
                    correctTranslation: word.translation,
                    options,
                };
            });

            setQuestions(generatedQuestions);
        } catch (error) {
            console.error("Error initializing quiz:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleOptionPress = (option: string) => {
        if (selectedOption !== null) return;

        setSelectedOption(option);

        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = option === currentQuestion.correctTranslation;
        const newScore = isCorrect ? score + 1 : score;

        if (isCorrect) {
            setScore(newScore);
            streakRef.current += 1;
            bestStreakRef.current = Math.max(bestStreakRef.current, streakRef.current);
        } else {
            streakRef.current = 0;
        }

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedOption(null);
            } else {
                setScore(newScore);
                setGameFinished(true);
                if (user) {
                    saveGameResult(user.id, {
                        correct: newScore,
                        total: questions.length,
                        bestStreak: bestStreakRef.current,
                    });
                }
            }
        }, 1000);
    };

    const getOptionStyle = (option: string) => {
        if (selectedOption === null) return styles.option;

        const currentQuestion = questions[currentQuestionIndex];

        if (option === currentQuestion.correctTranslation) {
            return [styles.option, styles.optionCorrect];
        }

        if (option === selectedOption && option !== currentQuestion.correctTranslation) {
            return [styles.option, styles.optionWrong];
        }

        return [styles.option, styles.optionDisabled];
    };

    const getOptionTextStyle = (option: string) => {
        if (selectedOption === null) return styles.optionText;
        const currentQuestion = questions[currentQuestionIndex];
        if (option === currentQuestion.correctTranslation) return [styles.optionText, styles.optionTextCorrect];
        if (option === selectedOption) return [styles.optionText, styles.optionTextWrong];
        return [styles.optionText, styles.optionTextDisabled];
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.secondary} />
                <Text style={styles.loadingText}>Cargando preguntas...</Text>
            </View>
        );
    }

    if (notEnoughWords) {
        return (
            <View style={styles.centerContainer}>
                <FontAwesome name="exclamation-circle" size={64} color={colors.gray} />
                <Text style={styles.notEnoughTitle}>Palabras insuficientes</Text>
                <Text style={styles.notEnoughText}>
                    Necesitas al menos 4 palabras para jugar al Listening.
                </Text>
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
                    <Text style={styles.resultEmoji}>
                        {percentage === 100 ? '🏆' : isGood ? '🎉' : '💪'}
                    </Text>
                    <Text style={styles.resultTitle}>¡Listening Completado!</Text>
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreNumber}>{score}</Text>
                        <Text style={styles.scoreTotal}>/ {questions.length}</Text>
                    </View>
                    <Text style={styles.scorePercentage}>{percentage}% correcto</Text>

                    <View style={styles.resultProgressBar}>
                        <View style={[styles.resultProgressFill, { width: `${percentage}%` as any, backgroundColor: isGood ? '#4caf50' : colors.secondary }]} />
                    </View>

                    <Text style={styles.resultMessage}>
                        {percentage === 100
                            ? '¡Perfecto! No has fallado ninguna.'
                            : isGood
                            ? '¡Muy bien! Sigue practicando.'
                            : '¡Sigue practicando, lo conseguirás!'}
                    </Text>
                </View>

                <View style={styles.resultActions}>
                    <TouchableOpacity style={styles.playAgainButton} onPress={initializeQuiz}>
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
                <Text style={styles.notEnoughText}>No se pudieron cargar las preguntas</Text>
            </View>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = currentQuestionIndex / questions.length;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
                </View>
                <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>Pregunta {currentQuestionIndex + 1} de {questions.length}</Text>
                    <Text style={styles.scoreLabel}>✓ {score}</Text>
                </View>
            </View>

            <View style={styles.questionCard}>
                <Text style={styles.questionLabel}>Escucha y elige la traducción</Text>
                <Pressable
                    style={({ pressed }) => [
                        styles.speakerButton,
                        pressed && styles.speakerButtonPressed
                    ]}
                    onPress={playCurrentWord}
                >
                    <View style={styles.speakerIconWrapper}>
                        <FontAwesome name="volume-up" size={48} color={colors.secondary} />
                    </View>
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
                        <Text style={getOptionTextStyle(option)}>{option}</Text>
                        {selectedOption !== null && option === currentQuestion.correctTranslation && (
                            <FontAwesome name="check" size={18} color="#4caf50" style={styles.optionIcon} />
                        )}
                        {selectedOption === option && option !== currentQuestion.correctTranslation && (
                            <FontAwesome name="times" size={18} color="#f44336" style={styles.optionIcon} />
                        )}
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
        paddingTop: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.grayDark,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        padding: 32,
        gap: 16,
    },
    notEnoughTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textDark,
        textAlign: 'center',
        marginTop: 12,
    },
    notEnoughText: {
        fontSize: 16,
        color: colors.grayDark,
        textAlign: 'center',
        lineHeight: 24,
    },
    backButton: {
        backgroundColor: colors.secondary,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        marginTop: 8,
    },
    backButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressBar: {
        height: 6,
        backgroundColor: colors.border,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.secondary,
        borderRadius: 3,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 13,
        color: colors.grayDark,
        fontWeight: '500',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#4caf50',
        fontWeight: 'bold',
    },
    questionCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 28,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    questionLabel: {
        fontSize: 13,
        color: colors.gray,
        marginBottom: 20,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    speakerButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    speakerButtonPressed: {
        opacity: 0.6,
        transform: [{ scale: 0.95 }],
    },
    speakerIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e6f4f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    speakerText: {
        fontSize: 15,
        color: colors.secondary,
        fontWeight: '600',
    },
    optionsContainer: {
        gap: 12,
    },
    option: {
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 18,
        borderWidth: 2,
        borderColor: colors.borderLight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    optionPressed: {
        backgroundColor: '#f0f0f0',
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
        opacity: 0.45,
    },
    optionText: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.textDark,
        textAlign: 'center',
        flex: 1,
    },
    optionTextCorrect: {
        color: '#2e7d32',
    },
    optionTextWrong: {
        color: '#c62828',
    },
    optionTextDisabled: {
        color: colors.gray,
    },
    optionIcon: {
        marginLeft: 8,
    },
    resultContainer: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
        padding: 24,
        justifyContent: 'center',
    },
    resultCard: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    resultEmoji: {
        fontSize: 64,
        marginBottom: 12,
    },
    resultTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.textDark,
        marginBottom: 24,
    },
    scoreCircle: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    scoreNumber: {
        fontSize: 72,
        fontWeight: 'bold',
        color: colors.secondary,
        lineHeight: 80,
    },
    scoreTotal: {
        fontSize: 28,
        color: colors.grayDark,
        marginLeft: 4,
        fontWeight: '600',
    },
    scorePercentage: {
        fontSize: 18,
        color: colors.grayDark,
        marginBottom: 20,
        fontWeight: '500',
    },
    resultProgressBar: {
        width: '100%',
        height: 10,
        backgroundColor: colors.border,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 20,
    },
    resultProgressFill: {
        height: '100%',
        borderRadius: 5,
    },
    resultMessage: {
        fontSize: 15,
        color: colors.grayDark,
        textAlign: 'center',
        lineHeight: 22,
    },
    resultActions: {
        marginTop: 24,
        gap: 12,
    },
    playAgainButton: {
        backgroundColor: colors.secondary,
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    playAgainButtonText: {
        color: colors.white,
        fontSize: 17,
        fontWeight: 'bold',
    },
    backButtonSecondary: {
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    backButtonSecondaryText: {
        color: colors.grayDark,
        fontSize: 16,
        fontWeight: '600',
    },
});
