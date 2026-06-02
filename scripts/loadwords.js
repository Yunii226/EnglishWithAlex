const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, addDoc, Timestamp } = require('firebase/firestore');

// Configuracion de Firebase  REEMPLAZAR
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Datos de ejemplo
const exampleUsers = [
  {
    id: "user_example1",
    email: "estudiante1@example.com"
  },
  {
    id: "user_example2", 
    email: "estudiante2@example.com"
  }
];

const exampleWords = [
  { word: "Hello", translation: "Hola", tags: ["saludos", "basico"] },
  { word: "Goodbye", translation: "Adios", tags: ["saludos", "basico"] },
  { word: "Thank you", translation: "Gracias", tags: ["cortesia", "basico"] },
  { word: "Please", translation: "Por favor", tags: ["cortesia", "basico"] },
  { word: "House", translation: "Casa", tags: ["vocabulario", "hogar"] },
  { word: "Car", translation: "Coche", tags: ["vocabulario", "transporte"] },
  { word: "Book", translation: "Libro", tags: ["vocabulario", "educacion"] },
  { word: "Computer", translation: "Ordenador", tags: ["vocabulario", "tecnologia"] },
  { word: "Friend", translation: "Amigo", tags: ["vocabulario", "relaciones"] },
  { word: "Family", translation: "Familia", tags: ["vocabulario", "relaciones"] },
  { word: "Water", translation: "Agua", tags: ["vocabulario", "comida"] },
  { word: "Food", translation: "Comida", tags: ["vocabulario", "comida"] },
  { word: "School", translation: "Escuela", tags: ["vocabulario", "educacion"] },
  { word: "Teacher", translation: "Profesor", tags: ["vocabulario", "educacion"] },
  { word: "Student", translation: "Estudiante", tags: ["vocabulario", "educacion"] },
];

// Funcion para poblar Firestore
async function populateFirestore() {
  try {
    console.log("Iniciando poblacion de Firestore...\n");

    // Crear usuarios de ejemplo
    for (const user of exampleUsers) {
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, {
        email: user.email,
        createdAt: Timestamp.now()
      });
      console.log(`Usuario creado: ${user.email}`);

      // Anadir palabras para cada usuario
      for (const word of exampleWords) {
        const wordsRef = collection(db, "users", user.id, "words");
        await addDoc(wordsRef, {
          word: word.word,
          translation: word.translation,
          tags: word.tags,
          createdAt: Timestamp.now()
        });
      }
      console.log(`${exampleWords.length} palabras anadidas para ${user.email}\n`);
    }

    console.log("Firestore poblado exitosamente!");
    console.log(`\nResumen:`);
    console.log(`- ${exampleUsers.length} usuarios creados`);
    console.log(`- ${exampleWords.length} palabras por usuario`);
    console.log(`- Total: ${exampleUsers.length * exampleWords.length} palabras\n`);

    process.exit(0);
  } catch (error) {
    console.error("Error al poblar Firestore:", error);
    process.exit(1);
  }
}

// Ejecutar el script
populateFirestore();
