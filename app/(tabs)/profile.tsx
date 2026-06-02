import { colors } from '@/constants/colors';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  // Cerrar sesión del usuario y redirigir a la pantalla de inicio de sesión
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // Contenido de la pantalla de perfil
  return (
    <View style={styles.container}>
      {/* Cabecera con avatar del usuario y su email */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Image source={require('@/assets/images/Alex.png')} style={styles.avatar} />
        </View>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.email}>{user?.emailAddresses[0]?.emailAddress}</Text>
      </View>

      {/* Botón para cerrar sesión */}
      <TouchableOpacity 
        style={styles.signOutButton}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <FontAwesome name="sign-out" size={20} color={colors.white} style={styles.icon} />
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos para la pantalla de perfil
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.white,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e6f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: colors.grayDark,
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: colors.error,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: 10,
  },
  signOutText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
