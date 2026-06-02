import { colors } from '@/constants/colors';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Layout() {
  const { isSignedIn, isLoaded } = useAuth();
  const [forceRedirect, setForceRedirect] = useState(false);

  useEffect(() => {
    // Si después de 3 segundos no ha cargado Clerk, forzar redirect a sign-in
    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.log('Clerk timeout - redirecting to sign-in');
        setForceRedirect(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Si Clerk cargó y el usuario tiene sesión, ir a tabs
  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // Si timeout o Clerk cargó sin usuario, ir a sign-in
  if (forceRedirect || (isLoaded && !isSignedIn)) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Mostrar loading mientras espera
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.secondary} />
      <Text style={styles.loadingText}>Cargando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.grayDark,
  },
});