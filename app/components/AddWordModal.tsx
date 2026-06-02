import { colors } from '@/constants/colors';
import { addWord } from "@/services/wordService";
import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface AddWordModalProps {
  visible: boolean;
  onClose: () => void;
  onWordAdded: () => void;
  userId: string;
}

export default function AddWordModal({ visible, onClose, onWordAdded, userId }: AddWordModalProps) {
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newTags, setNewTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddWord = async () => {
    if (!newWord.trim() || !newTranslation.trim()) {
      Alert.alert('Error', 'Por favor completa la palabra y su traducción');
      return;
    }

    setSaving(true);
    try {
      const tagsArray = newTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      await addWord(userId, newWord.trim(), newTranslation.trim(), tagsArray);
      
      // Limpiar formulario y cerrar modal
      setNewWord('');
      setNewTranslation('');
      setNewTags('');
      onClose();
      
      onWordAdded();
      
      // Avisar de que se ha guardado la palabra
      Alert.alert('Éxito', 'Palabra añadida correctamente');
    } catch (error) {
      console.error("Error añadiendo palabra:", error);
      Alert.alert('Error', 'No se pudo añadir la palabra');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNewWord('');
    setNewTranslation('');
    setNewTags('');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable 
          style={styles.modalBackground} 
          onPress={handleClose}
        />
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir Nueva Palabra</Text>
              <TouchableOpacity onPress={handleClose}>
                <FontAwesome name="times" size={24} color={colors.grayDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Palabra (Inglés)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: hello"
                value={newWord}
                onChangeText={setNewWord}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Traducción (Español)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: hola"
                value={newTranslation}
                onChangeText={setNewTranslation}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Tags (separados por comas)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: saludos, básico"
                value={newTags}
                onChangeText={setNewTags}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleAddWord}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Palabra</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
