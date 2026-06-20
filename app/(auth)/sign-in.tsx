import { colors } from '@/constants/colors';
import { useSignIn } from '@clerk/clerk-expo';
import type { EmailCodeFactor } from '@clerk/types';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

function InputField({
    icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, focused, onFocus, onBlur
}: any) {
    return (
        <View style={[authStyles.inputContainer, focused && authStyles.inputContainerFocused]}>
            <FontAwesome name={icon} size={18} color={focused ? colors.primary : colors.gray} style={authStyles.inputIcon} />
            <TextInput
                style={authStyles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChangeText}
                onFocus={onFocus}
                onBlur={onBlur}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType ?? 'default'}
                autoCapitalize="none"
            />
        </View>
    );
}

export default function Page() {
    const { signIn, setActive, isLoaded } = useSignIn()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [code, setCode] = React.useState('')
    const [showEmailCode, setShowEmailCode] = React.useState(false)
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [focused, setFocused] = React.useState<string | null>(null)

    const onSignInPress = React.useCallback(async () => {
        if (!isLoaded) return
        setError('')
        setLoading(true)
        try {
            const signInAttempt = await signIn.create({ identifier: emailAddress, password })

            if (signInAttempt.status === 'complete') {
                await setActive({
                    session: signInAttempt.createdSessionId,
                    navigate: async ({ session }) => {
                        if (session?.currentTask) { console.log(session?.currentTask); return }
                        router.replace('/')
                    },
                })
            } else if (signInAttempt.status === 'needs_second_factor') {
                const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
                    (factor): factor is EmailCodeFactor => factor.strategy === 'email_code',
                )
                if (emailCodeFactor) {
                    await signIn.prepareSecondFactor({ strategy: 'email_code', emailAddressId: emailCodeFactor.emailAddressId })
                    setShowEmailCode(true)
                }
            } else {
                console.error(JSON.stringify(signInAttempt, null, 2))
            }
        } catch (err: any) {
            if (err.errors?.[0]?.code === 'form_password_incorrect' || err.errors?.[0]?.code === 'form_identifier_not_found') {
                setError('Correo electrónico o contraseña incorrectos')
            } else {
                setError('Error al iniciar sesión. Por favor, intenta de nuevo.')
            }
        } finally {
            setLoading(false)
        }
    }, [isLoaded, signIn, setActive, router, emailAddress, password])

    const onVerifyPress = React.useCallback(async () => {
        if (!isLoaded) return
        setError('')
        try {
            const signInAttempt = await signIn.attemptSecondFactor({ strategy: 'email_code', code })
            if (signInAttempt.status === 'complete') {
                await setActive({
                    session: signInAttempt.createdSessionId,
                    navigate: async ({ session }) => {
                        if (session?.currentTask) { console.log(session?.currentTask); return }
                        router.replace('/')
                    },
                })
            } else {
                console.error(JSON.stringify(signInAttempt, null, 2))
            }
        } catch (err: any) {
            if (err.errors?.[0]?.code === 'form_code_incorrect') {
                setError('Código de verificación incorrecto.')
            } else {
                setError('Error al verificar el código.')
            }
        }
    }, [isLoaded, signIn, setActive, router, code])

    if (showEmailCode) {
        return (
            <KeyboardAvoidingView style={authStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <LinearGradient colors={['#4F6EF7', '#7B95FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={authStyles.topGradient}>
                    <View style={authStyles.logoCircle}>
                        <Image source={require('@/assets/images/Alex.png')} style={authStyles.logo} />
                    </View>
                    <Text style={authStyles.gradientTitle}>Verifica tu email</Text>
                    <Text style={authStyles.gradientSubtitle}>Hemos enviado un código a tu correo</Text>
                </LinearGradient>
                <ScrollView contentContainerStyle={authStyles.scrollContent} showsVerticalScrollIndicator={false}>
                    {error ? <ErrorBox text={error} /> : null}
                    <Text style={authStyles.label}>Código de verificación</Text>
                    <InputField
                        icon="key"
                        placeholder="Ingresa el código"
                        value={code}
                        onChangeText={(v: string) => setCode(v)}
                        keyboardType="numeric"
                        focused={focused === 'code'}
                        onFocus={() => setFocused('code')}
                        onBlur={() => setFocused(null)}
                    />
                    <AuthButton label="Verificar" onPress={onVerifyPress} disabled={!code} loading={false} />
                </ScrollView>
            </KeyboardAvoidingView>
        )
    }

    return (
        <KeyboardAvoidingView style={authStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <LinearGradient colors={['#4F6EF7', '#7B95FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={authStyles.topGradient}>
                <View style={authStyles.logoCircle}>
                    <Image source={require('@/assets/images/Alex.png')} style={authStyles.logo} />
                </View>
                <Text style={authStyles.gradientTitle}>¡Bienvenido!</Text>
                <Text style={authStyles.gradientSubtitle}>Inicia sesión para continuar aprendiendo</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={authStyles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {error ? <ErrorBox text={error} /> : null}

                <Text style={authStyles.label}>Correo electrónico</Text>
                <InputField
                    icon="envelope"
                    placeholder="tu@email.com"
                    value={emailAddress}
                    onChangeText={(v: string) => setEmailAddress(v)}
                    keyboardType="email-address"
                    focused={focused === 'email'}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                />

                <Text style={[authStyles.label, { marginTop: 16 }]}>Contraseña</Text>
                <InputField
                    icon="lock"
                    placeholder="Tu contraseña"
                    value={password}
                    onChangeText={(v: string) => setPassword(v)}
                    secureTextEntry
                    focused={focused === 'password'}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                />

                <AuthButton label="Iniciar sesión" onPress={onSignInPress} disabled={!emailAddress || !password || loading} loading={loading} />

                <View style={authStyles.divider}>
                    <View style={authStyles.dividerLine} />
                    <Text style={authStyles.dividerText}>O</Text>
                    <View style={authStyles.dividerLine} />
                </View>

                <View style={authStyles.linkContainer}>
                    <Text style={authStyles.linkText}>¿No tienes una cuenta? </Text>
                    <Link href="/sign-up" asChild>
                        <Pressable><Text style={authStyles.linkButton}>Regístrate</Text></Pressable>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

function ErrorBox({ text }: { text: string }) {
    return (
        <View style={authStyles.errorContainer}>
            <FontAwesome name="exclamation-circle" size={16} color={colors.error} />
            <Text style={authStyles.errorText}>{text}</Text>
        </View>
    );
}

function AuthButton({ label, onPress, disabled, loading }: { label: string; onPress: () => void; disabled: boolean; loading: boolean }) {
    return (
        <Pressable
            style={({ pressed }) => [authStyles.button, disabled && authStyles.buttonDisabled, pressed && authStyles.buttonPressed]}
            onPress={onPress}
            disabled={disabled}
        >
            {loading ? (
                <ActivityIndicator color={colors.white} />
            ) : disabled ? (
                <Text style={authStyles.buttonText}>{label}</Text>
            ) : (
                <LinearGradient colors={['#4F6EF7', '#7B95FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={authStyles.buttonGradient}>
                    <Text style={authStyles.buttonText}>{label}</Text>
                </LinearGradient>
            )}
        </Pressable>
    );
}

export const authStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    topGradient: {
        paddingTop: 60,
        paddingBottom: 36,
        alignItems: 'center',
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    logoCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
    },
    gradientTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.white,
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    gradientSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
        paddingHorizontal: 30,
        textAlign: 'center',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 28,
        paddingBottom: 40,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMedium,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 14,
        backgroundColor: colors.white,
        paddingHorizontal: 14,
    },
    inputContainerFocused: {
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.textDark,
    },
    button: {
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 24,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonGradient: {
        width: '100%',
        paddingVertical: 17,
        alignItems: 'center',
    },
    buttonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.99 }],
    },
    buttonDisabled: {
        backgroundColor: colors.gray,
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: colors.white,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
        paddingVertical: 17,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 28,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        marginHorizontal: 12,
        color: colors.gray,
        fontSize: 13,
        fontWeight: '600',
    },
    linkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkText: {
        fontSize: 15,
        color: colors.grayDark,
    },
    linkButton: {
        fontSize: 15,
        color: colors.primary,
        fontWeight: '700',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: colors.error,
        marginBottom: 20,
        gap: 8,
    },
    errorText: {
        color: colors.error,
        fontSize: 13,
        flex: 1,
        fontWeight: '500',
    },
});
