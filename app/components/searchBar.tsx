import { colors } from '@/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
}

const SearchBar = ({ value, onChangeText }: SearchBarProps) => {
    // Renderiza el componente
    return (
        <View style={styles.contenedor}>
            <TextInput
                style={styles.input}
                placeholder="Buscar palabra o traducción..."
                value={value}
                onChangeText={onChangeText}
            />
            <FontAwesome name="search" size={22} style={styles.icon} />
        </View>
    );
};
// Estilos para el componente SearchBar
const styles = StyleSheet.create({
    contenedor: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: colors.textDark,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 20,
        padding: 10,
        paddingRight: 40, 
        marginBottom: 15,
        fontSize: 16,
        
        
    },
    resultado: {
        fontSize: 18,
        color: colors.primary,
    },
    icon:{
        marginLeft:-30,
        marginTop:-16,
        color: colors.gray,
    }
});
export default SearchBar;