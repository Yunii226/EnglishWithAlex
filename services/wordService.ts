import { db } from '@/config/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';

// Crear o actualizar documento de usuario en Firestore
export async function createOrUpdateUser(userId: string, email: string) {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      email,
      createdAt: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error('Error creando/actualizando usuario:', error);
    throw error;
  }
}

// Obtener todas las palabras del usuario
export async function getUserWords(userId: string) {
  try {
    const wordsRef = collection(db, 'users', userId, 'words');
    const snapshot = await getDocs(wordsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error obteniendo palabras:', error);
    throw error;
  }
}

export async function addWord(userId: string, word: string, translation: string, tags?: string[]) {
  try {
    const wordsRef = collection(db, 'users', userId, 'words');
    await addDoc(wordsRef, {
      word,
      translation,
      tags: tags || [],
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error añadiendo palabra:', error);
    throw error;
  }
}

export async function deleteWord(userId: string, wordId: string) {
  try {
    const wordDocRef = doc(db, 'users', userId, 'words', wordId);
    await deleteDoc(wordDocRef);
    return { success: true };
  } catch (error) {
    console.error('Error eliminando palabra:', error);
    throw error;
  }
}

