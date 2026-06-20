import { colors } from '@/constants/colors';
import { addWord } from "@/services/wordService";
import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
  const [error, setError] = useState('');

  const handleAddWord = async () => {
    if (!newWord.trim() || !newTranslation.trim()) {
      setError('Por favor completa la palabra y su traducción');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const tagsArray = newTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await addWord(userId, newWord.trim(), newTranslation.trim(), tagsArray);

      setNewWord('');
      setNewTranslation('');
      setNewTags('');
      onClose();
      onWordAdded();
    } catch (err) {
      console.error("Error añadiendo palabra:", err);
      setError('No se pudo añadir la palabra. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNewWord('');
    setNewTranslation('');
    setNewTags('');
    setError('');
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
              <Text style={styles.modalTitle}>Añadir Palabra</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <FontAwesome name="times" size={20} color={colors.grayDark} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <Text style={styles.label}>Palabra en inglés</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: hello"
                value={newWord}
                onChangeText={(text) => { setNewWord(text); setError(''); }}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Traducción al español</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: hola"
                value={newTranslation}
                onChangeText={(text) => { setNewTranslation(text); setError(''); }}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Tags <Text style={styles.labelOptional}>(separados por comas, opcional)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: saludos, básico"
                value={newTags}
                onChangeText={setNewTags}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, (saving || !newWord.trim() || !newTranslation.trim()) && styles.saveButtonDisabled]}
              onPress={handleAddWord}
              disabled={saving || !newWord.trim() || !newTranslation.trim()}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f0',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    flex: 1,
  },
  form: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  labelOptional: {
    fontWeight: '400',
    color: colors.gray,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.textDark,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
});
