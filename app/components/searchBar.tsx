import { colors } from '@/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
}

const SearchBar = ({ value, onChangeText }: SearchBarProps) => {
    return (
        <View style={styles.container}>
            <FontAwesome name="search" size={18} style={styles.icon} />
            <TextInput
                style={styles.input}
                placeholder="Buscar palabra o traducción..."
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 14,
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    icon: {
        color: colors.gray,
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.textDark,
    },
});

export default SearchBar;
