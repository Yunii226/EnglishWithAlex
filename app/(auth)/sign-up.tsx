import { colors } from '@/constants/colors';
import { createOrUpdateUser } from '@/services/wordService';
import { useSignUp } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Page() {
    const { isLoaded, signUp, setActive } = useSignUp()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [pendingVerification, setPendingVerification] = React.useState(false)
    const [code, setCode] = React.useState('')
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    // Handle submission of sign-up form
    const onSignUpPress = async () => {
        if (!isLoaded) return

        setError('')
        setLoading(true)
        // Start sign-up process using email and password provided
        try {
            await signUp.create({
                emailAddress,
                password,
            })

            // Send user an email with verification code
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

            // Set 'pendingVerification' to true to display second form
            // and capture code
            setPendingVerification(true)
        } catch (err: any) {
            // See https://clerk.com/docs/guides/development/custom-flows/error-handling
            // for more info on error handling
            console.error(JSON.stringify(err, null, 2))
            
            const errorCode = err.errors?.[0]?.code;
            
            if (errorCode === 'form_password_pwned') {
                setError('Esta contraseña no es segura. Por favor, usa una contraseña diferente y más segura.');
            } else if (errorCode === 'form_password_length_too_short') {
                setError('La contraseña es demasiado corta. Debe tener al menos 8 caracteres.');
            } else if (errorCode === 'form_identifier_exists') {
                setError('Este correo electrónico ya está registrado. Intenta iniciar sesión.');
            } else {
                setError('Error al crear la cuenta. Por favor, intenta de nuevo.');
            }
        } finally {
            setLoading(false)
        }
    }

    // Handle submission of verification form
    const onVerifyPress = async () => {
        if (!isLoaded) return

        try {
            // Use the code the user provided to attempt verification
            const signUpAttempt = await signUp.attemptEmailAddressVerification({
                code,
            })

            // If verification was completed, set the session to active
            // and redirect the user
            if (signUpAttempt.status === 'complete') {
                // Crear documento de usuario en Firestore con su email
                const userId = signUpAttempt.createdUserId;
                if (userId && emailAddress) {
                    await createOrUpdateUser(userId, emailAddress);
                }

                await setActive({
                    session: signUpAttempt.createdSessionId,
                    navigate: async ({ session }) => {
                        if (session?.currentTask) {
                            // Check for tasks and navigate to custom UI to help users resolve them
                            // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
                            console.log(session?.currentTask)
                            return
                        }

                        router.replace('/')
                    },
                })
            } else {
                // If the status is not complete, check why. User may need to
                // complete further steps.
                console.error(JSON.stringify(signUpAttempt, null, 2))
            }
        } catch (err) {
            // See https://clerk.com/docs/guides/development/custom-flows/error-handling
            // for more info on error handling
            console.error(JSON.stringify(err, null, 2))
        }
    }

    if (pendingVerification) {
        return (
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Image source={require('@/assets/images/Alex.png')} style={styles.logo} />
                        </View>
                        <Text style={styles.title}>Verifica tu email</Text>
                        <Text style={styles.subtitle}>
                            Hemos enviado un código de verificación a tu correo electrónico
                        </Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Código de verificación</Text>
                        <View style={styles.inputContainer}>
                            <FontAwesome name="key" size={20} color={colors.grayDark} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={code}
                                placeholder="Ingresa el código"
                                placeholderTextColor={colors.gray}
                                onChangeText={(code) => setCode(code)}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            !code && styles.buttonDisabled,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={onVerifyPress}
                        disabled={!code}
                    >
                        <Text style={styles.buttonText}>Verificar</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        )
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Image source={require('@/assets/images/Alex.png')} style={styles.logo} />
                    </View>
                    <Text style={styles.title}>Crear cuenta</Text>
                    <Text style={styles.subtitle}>Únete y comienza a aprender inglés</Text>
                </View>

                {error ? (
                    <View style={styles.errorContainer}>
                        <FontAwesome name="exclamation-circle" size={20} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Correo electrónico</Text>
                    <View style={styles.inputContainer}>
                        <FontAwesome name="envelope" size={20} color={colors.grayDark} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            autoCapitalize="none"
                            value={emailAddress}
                            placeholder="tu@email.com"
                            placeholderTextColor={colors.gray}
                            onChangeText={(email) => setEmailAddress(email)}
                            keyboardType="email-address"
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Contraseña</Text>
                    <View style={styles.inputContainer}>
                        <FontAwesome name="lock" size={20} color={colors.grayDark} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={password}
                            placeholder="Crea una contraseña segura"
                            placeholderTextColor={colors.gray}
                            secureTextEntry={true}
                            onChangeText={(password) => setPassword(password)}
                        />
                    </View>
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        (!emailAddress || !password || loading) && styles.buttonDisabled,
                        pressed && styles.buttonPressed,
                    ]}
                    onPress={onSignUpPress}
                    disabled={!emailAddress || !password || loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Continuar</Text>
                    )}
                </Pressable>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>O</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.linkContainer}>
                    <Text style={styles.linkText}>¿Ya tienes una cuenta? </Text>
                    <Link href="/sign-in" asChild>
                        <Pressable>
                            <Text style={styles.linkButton}>Inicia sesión</Text>
                        </Pressable>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#e6f4ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
    },
    logo: {
        width: 220,
        height: 220,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textDark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.grayDark,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        backgroundColor: colors.background,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        color: colors.textDark,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
        backgroundColor: colors.gray,
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        marginHorizontal: 10,
        color: colors.gray,
        fontSize: 14,
    },
    linkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    linkText: {
        fontSize: 16,
        color: colors.grayDark,
    },
    linkButton: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: 'bold',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffe6e6',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
        marginBottom: 20,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
})