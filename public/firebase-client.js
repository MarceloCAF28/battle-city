/**
 * Configuração Firebase para o Frontend (Browser)
 * Importar este arquivo no seu index.html ou no game.js
 */

// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Configuração Firebase do seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyCFl9ooAgteF4lA2KNB0MMkOMs-nOjN-80",
  authDomain: "battle-city-bd36e.firebaseapp.com",
  projectId: "battle-city-bd36e",
  storageBucket: "battle-city-bd36e.firebasestorage.app",
  messagingSenderId: "1085542519227",
  appId: "1:1085542519227:web:b8c0b33c32cd74e550f49e",
  measurementId: "G-SRGGGDY32X"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

console.log('✓ Firebase inicializado no frontend');

// ─── Funções de Autenticação ────────────────────────────────────────────────

/**
 * Registrar novo usuário
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<User>}
 */
export async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✓ Usuário registrado:', user.email);
    
    // Obter token ID do Firebase
    const token = await user.getIdToken();
    
    return {
      uid: user.uid,
      email: user.email,
      token: token,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error('❌ Erro ao registrar:', error.message);
    throw error;
  }
}

/**
 * Login de usuário
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<User>}
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✓ Usuário logado:', user.email);
    
    // Obter token ID do Firebase
    const token = await user.getIdToken();
    
    return {
      uid: user.uid,
      email: user.email,
      token: token,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    throw error;
  }
}

/**
 * Logout do usuário
 * @returns {Promise<void>}
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('✓ Usuário desconectado');
  } catch (error) {
    console.error('❌ Erro ao logout:', error.message);
    throw error;
  }
}

/**
 * Obter token atual do usuário logado
 * @returns {Promise<string|null>}
 */
export async function getCurrentToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}

/**
 * Observar mudanças de autenticação
 * @param {Function} callback - Função chamada quando o estado de autenticação muda
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      callback({
        uid: user.uid,
        email: user.email,
        token: token,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isLoggedIn: true,
      });
    } else {
      callback({
        isLoggedIn: false,
        user: null,
        token: null,
      });
    }
  });
}

/**
 * Obter usuário atual
 * @returns {User|null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}

export { auth, app };
