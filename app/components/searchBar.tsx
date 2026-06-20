import { colors } from '@/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
}

const SearchBar = ({ value, onChangeText }: SearchBarProps) => {
    const [focused, setFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
        setFocused(true);
        Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    };

    const handleBlur = () => {
        setFocused(false);
        Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.primary],
    });

    return (
        <Animated.View style={[styles.container, { borderColor }]}>
            <FontAwesome name="search" size={16} style={[styles.icon, focused && styles.iconFocused]} />
            <TextInput
                style={styles.input}
                placeholder="Buscar palabra o traducción..."
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
                    <FontAwesome name="times-circle" size={16} color={colors.gray} />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 14,
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    icon: {
        color: colors.gray,
        marginRight: 10,
    },
    iconFocused: {
        color: colors.primary,
    },
    input: {
        flex: 1,
        paddingVertical: 13,
        fontSize: 15,
        color: colors.textDark,
    },
    clearButton: {
        padding: 4,
        marginLeft: 6,
    },
});

export default SearchBar;
