import { colors } from '@/constants/colors';
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import GameCard from "../components/GameCard";

export default function Arcade() {
  const router = useRouter();

  // Navegar al juego de Quiz
  const handleQuizPress = () => {
    router.push('/(games)/quiz');
  };

  // Navegar al juego de Listening
  const handleListeningPress = () => {
    router.push('/(games)/listening');
  };

  // Contenido de la pantalla del Arcade
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Arcade</Text>
      
      {/* Grid con las tarjetas de los juegos disponibles */}
      <View style={styles.gamesGrid}>
        <GameCard
          title="Quiz"
          description="Elige la palabra correcta entre 4 opciones."
          icon="question-circle"
          color={colors.primary}
          onPress={handleQuizPress}
        />
        <GameCard
          title="Listening"
          description="Escucha y elige la opción correcta."
          icon="headphones"
          color={colors.secondary}
          onPress={handleListeningPress}
        />
      </View>

      {/* Sección inferior con imagen del arcade */}
      <View style={styles.bottomSection}>
        <Image 
          source={require('@/assets/images/AlexArcade.png')} 
          style={styles.image}
        />
        <Text style={styles.subtitle}>Más juegos pronto</Text>
      </View>
    </ScrollView>
  );
}

// Estilos para la pantalla del Arcade
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: colors.grayDark,
    textAlign: 'center',
  },
});
