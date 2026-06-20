import { colors } from '@/constants/colors';
import { createOrUpdateUser } from '@/services/wordService';
import { useSignUp } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { authStyles } from './sign-in';

function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, focused, onFocus, onBlur }: any) {
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
                <ActivityIndicator color={colors.white} style={{ paddingVertical: 17 }} />
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

export default function Page() {
    const { isLoaded, signUp, setActive } = useSignUp()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [pendingVerification, setPendingVerification] = React.useState(false)
    const [code, setCode] = React.useState('')
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [focused, setFocused] = React.useState<string | null>(null)

    const onSignUpPress = async () => {
        if (!isLoaded) return
        setError('')
        setLoading(true)
        try {
            await signUp.create({ emailAddress, password })
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
            setPendingVerification(true)
        } catch (err: any) {
            const errorCode = err.errors?.[0]?.code;
            if (errorCode === 'form_password_pwned') {
                setError('Esta contraseña no es segura. Usa una contraseña diferente.');
            } else if (errorCode === 'form_password_length_too_short') {
                setError('La contraseña es demasiado corta. Mínimo 8 caracteres.');
            } else if (errorCode === 'form_identifier_exists') {
                setError('Este correo ya está registrado. Intenta iniciar sesión.');
            } else {
                setError('Error al crear la cuenta. Por favor, intenta de nuevo.');
            }
        } finally {
            setLoading(false)
        }
    }

    const onVerifyPress = async () => {
        if (!isLoaded) return
        try {
            const signUpAttempt = await signUp.attemptEmailAddressVerification({ code })
            if (signUpAttempt.status === 'complete') {
                const userId = signUpAttempt.createdUserId;
                if (userId && emailAddress) {
                    await createOrUpdateUser(userId, emailAddress);
                }
                await setActive({
                    session: signUpAttempt.createdSessionId,
                    navigate: async ({ session }) => {
                        if (session?.currentTask) { console.log(session?.currentTask); return }
                        router.replace('/')
                    },
                })
            } else {
                console.error(JSON.stringify(signUpAttempt, null, 2))
            }
        } catch (err) {
            console.error(JSON.stringify(err, null, 2))
        }
    }

    if (pendingVerification) {
        return (
            <KeyboardAvoidingView style={authStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <LinearGradient colors={['#10B981', '#34D399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={authStyles.topGradient}>
                    <View style={authStyles.logoCircle}>
                        <Image source={require('@/assets/images/Alex.png')} style={authStyles.logo} />
                    </View>
                    <Text style={authStyles.gradientTitle}>Verifica tu email ✉️</Text>
                    <Text style={authStyles.gradientSubtitle}>Revisa tu bandeja de entrada y copia el código</Text>
                </LinearGradient>
                <ScrollView contentContainerStyle={authStyles.scrollContent} showsVerticalScrollIndicator={false}>
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
                    <AuthButton label="Verificar y continuar" onPress={onVerifyPress} disabled={!code} loading={false} />
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
                <Text style={authStyles.gradientTitle}>Crear cuenta 🚀</Text>
                <Text style={authStyles.gradientSubtitle}>Únete y comienza a aprender inglés</Text>
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
                    placeholder="Crea una contraseña segura"
                    value={password}
                    onChangeText={(v: string) => setPassword(v)}
                    secureTextEntry
                    focused={focused === 'password'}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                />

                <AuthButton label="Continuar" onPress={onSignUpPress} disabled={!emailAddress || !password || loading} loading={loading} />

                <View style={authStyles.divider}>
                    <View style={authStyles.dividerLine} />
                    <Text style={authStyles.dividerText}>O</Text>
                    <View style={authStyles.dividerLine} />
                </View>

                <View style={authStyles.linkContainer}>
                    <Text style={authStyles.linkText}>¿Ya tienes una cuenta? </Text>
                    <Link href="/sign-in" asChild>
                        <Pressable><Text style={authStyles.linkButton}>Inicia sesión</Text></Pressable>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({});
