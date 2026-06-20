import { colors } from '@/constants/colors';
import { addWord } from "@/services/wordService";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from "react";
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const saveScale = useRef(new Animated.Value(1)).current;

  const handleAddWord = async () => {
    if (!newWord.trim() || !newTranslation.trim()) {
      setError('Por favor completa la palabra y su traducción');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const tagsArray = newTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
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

  const animateSave = () => {
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }),
      Animated.spring(saveScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    handleAddWord();
  };

  const isDisabled = saving || !newWord.trim() || !newTranslation.trim();

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackground} onPress={handleClose} />
        <View style={styles.modalContent}>
          <View style={styles.dragHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <View style={styles.titleRow}>
                <View style={styles.titleIcon}>
                  <FontAwesome name="plus" size={14} color={colors.white} />
                </View>
                <Text style={styles.modalTitle}>Nueva Palabra</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <FontAwesome name="times" size={18} color={colors.grayDark} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-circle" size={15} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <Text style={styles.label}>
                <FontAwesome name="language" size={13} color={colors.primary} /> {'  '}Palabra en inglés
              </Text>
              <View style={[styles.inputWrapper, focusedField === 'word' && styles.inputWrapperFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: accomplish"
                  placeholderTextColor={colors.gray}
                  value={newWord}
                  onChangeText={(text) => { setNewWord(text); setError(''); }}
                  onFocus={() => setFocusedField('word')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>
                <FontAwesome name="exchange" size={13} color={colors.secondary} /> {'  '}Traducción al español
              </Text>
              <View style={[styles.inputWrapper, focusedField === 'translation' && styles.inputWrapperFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: lograr, conseguir"
                  placeholderTextColor={colors.gray}
                  value={newTranslation}
                  onChangeText={(text) => { setNewTranslation(text); setError(''); }}
                  onFocus={() => setFocusedField('translation')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>
                <FontAwesome name="tag" size={13} color={colors.accent} /> {'  '}
                Tags <Text style={styles.labelOptional}>(opcional, separados por comas)</Text>
              </Text>
              <View style={[styles.inputWrapper, focusedField === 'tags' && styles.inputWrapperFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: verbos, negocios"
                  placeholderTextColor={colors.gray}
                  value={newTags}
                  onChangeText={setNewTags}
                  onFocus={() => setFocusedField('tags')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <TouchableOpacity
                onPress={animateSave}
                disabled={isDisabled}
                activeOpacity={0.9}
                style={styles.saveButtonWrapper}
              >
                {isDisabled ? (
                  <View style={styles.saveButtonDisabled}>
                    {saving ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.saveButtonText}>Guardar Palabra</Text>
                    )}
                  </View>
                ) : (
                  <LinearGradient
                    colors={['#4F6EF7', '#7B95FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButtonGradient}
                  >
                    <FontAwesome name="check" size={16} color={colors.white} style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Guardar Palabra</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </Animated.View>
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
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10, 15, 40, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 48,
    maxHeight: '88%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  form: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMedium,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelOptional: {
    fontWeight: '500',
    color: colors.gray,
    textTransform: 'none',
    letterSpacing: 0,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    padding: 14,
    fontSize: 16,
    color: colors.textDark,
  },
  saveButtonWrapper: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    padding: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray,
    padding: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
