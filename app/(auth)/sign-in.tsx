import { colors } from '@/constants/colors';
import { useSignIn } from '@clerk/clerk-expo';
import type { EmailCodeFactor } from '@clerk/types';
import { FontAwesome } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Page() {
    const { signIn, setActive, isLoaded } = useSignIn()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [code, setCode] = React.useState('')
    const [showEmailCode, setShowEmailCode] = React.useState(false)
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    // Handle the submission of the sign-in form
    const onSignInPress = React.useCallback(async () => {
        if (!isLoaded) return

        setError('')
        setLoading(true)
        // Start the sign-in process using the email and password provided
        try {
            const signInAttempt = await signIn.create({
                identifier: emailAddress,
                password,
            })

            // If sign-in process is complete, set the created session as active
            // and redirect the user
            if (signInAttempt.status === 'complete') {
                await setActive({
                    session: signInAttempt.createdSessionId,
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
            } else if (signInAttempt.status === 'needs_second_factor') {
                // Check if email_code is a valid second factor
                // This is required when Client Trust is enabled and the user
                // is signing in from a new device.
                // See https://clerk.com/docs/guides/secure/client-trust
                const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
                    (factor): factor is EmailCodeFactor => factor.strategy === 'email_code',
                )

                if (emailCodeFactor) {
                    await signIn.prepareSecondFactor({
                        strategy: 'email_code',
                        emailAddressId: emailCodeFactor.emailAddressId,
                    })
                    setShowEmailCode(true)
                }
            } else {
                // If the status is not complete, check why. User may need to
                // complete further steps.
                console.error(JSON.stringify(signInAttempt, null, 2))
            }
        } catch (err: any) {
            // See https://clerk.com/docs/guides/development/custom-flows/error-handling
            // for more info on error handling
            console.error(JSON.stringify(err, null, 2))
            
            if (err.errors?.[0]?.code === 'form_password_incorrect' || 
                err.errors?.[0]?.code === 'form_identifier_not_found') {
                setError('Correo electrónico o contraseña incorrectos')
            } else {
                setError('Error al iniciar sesión. Por favor, intenta de nuevo.')
            }
        } finally {
            setLoading(false)
        }
    }, [isLoaded, signIn, setActive, router, emailAddress, password])

    // Handle the submission of the email verification code
    const onVerifyPress = React.useCallback(async () => {
        if (!isLoaded) return

        setError('')
        try {
            const signInAttempt = await signIn.attemptSecondFactor({
                strategy: 'email_code',
                code,
            })

            if (signInAttempt.status === 'complete') {
                await setActive({
                    session: signInAttempt.createdSessionId,
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
                console.error(JSON.stringify(signInAttempt, null, 2))
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2))
            
            if (err.errors?.[0]?.code === 'form_code_incorrect') {
                setError('Código de verificación incorrecto. Por favor, intenta de nuevo.')
            } else {
                setError('Error al verificar el código. Por favor, intenta de nuevo.')
            }
        }
    }, [isLoaded, signIn, setActive, router, code])

    // Display email code verification form
    if (showEmailCode) {
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

                    {error ? (
                        <View style={styles.errorContainer}>
                            <FontAwesome name="exclamation-circle" size={20} color={colors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

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
                    <Text style={styles.title}>Bienvenido</Text>
                    <Text style={styles.subtitle}>Inicia sesión para continuar aprendiendo</Text>
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
                            onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
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
                            placeholder="Tu contraseña"
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
                    onPress={onSignInPress}
                    disabled={!emailAddress || !password || loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Iniciar sesión</Text>
                    )}
                </Pressable>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>O</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.linkContainer}>
                    <Text style={styles.linkText}>¿No tienes una cuenta? </Text>
                    <Link href="/sign-up" asChild>
                        <Pressable>
                            <Text style={styles.linkButton}>Regístrate</Text>
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