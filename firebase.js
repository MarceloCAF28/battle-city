// ─── Configuração Firebase Admin (Node.js Server) ─────────────────────────
const admin = require('firebase-admin');
require('dotenv').config();

// Usar credenciais Firebase Admin
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('❌ Credenciais Firebase obrigatórias não encontradas no .env');
  console.error('   Defina: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
  process.exit(1);
}

// Decodificar private key com múltiplas estratégias
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Estratégia 1: Se for base64, decodificar
if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
  try {
    privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
    console.log('✓ Chave decodificada de base64');
  } catch (e) {
    console.warn('⚠️  Não era base64, tentando como string');
  }
}

// Estratégia 2: Converter escape sequences corretos
if (privateKey) {
  // Converter \n literal para quebras de linha reais
  // Isso lida com "\\n" (escape duplo) e "\n" (escape simples)
  privateKey = privateKey
    .replace(/\\\\n/g, '\n')  // Primeiro: \\\n → \n
    .replace(/\\n/g, '\n')     // Depois: \\n → \n
    .replace(/\\t/g, '\t')     // Tab também
    .replace(/\\r/g, '\r');    // Carriage return também
  
  console.log('✓ Escape sequences corrigidas');
}

// Inicializar Firebase Admin
let firebaseAuth;

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  firebaseAuth = admin.auth();
  console.log('✓ Firebase Admin SDK inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error.message);
  console.error('   Verifique as credenciais FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

// ─── Verificar Token Firebase ───────────────────────────────────────────────
async function verifyToken(token) {
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error.message);
    return null;
  }
}

// ─── Obter Usuário Firebase por UID ────────────────────────────────────────
async function getFirebaseUser(uid) {
  try {
    const user = await firebaseAuth.getUser(uid);
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime,
    };
  } catch (error) {
    console.error('❌ Erro ao obter usuário:', error.message);
    return null;
  }
}

// ─── Criar Usuário Firebase ────────────────────────────────────────────────
async function createFirebaseUser(email, password, displayName = null) {
  try {
    const userRecord = await firebaseAuth.createUser({
      email,
      password,
      displayName,
    });

    console.log('✓ Usuário Firebase criado:', userRecord.uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    };
  } catch (error) {
    console.error('❌ Erro ao criar usuário Firebase:', error.message);
    throw error;
  }
}

// ─── Deletar Usuário Firebase ──────────────────────────────────────────────
async function deleteFirebaseUser(uid) {
  try {
    await firebaseAuth.deleteUser(uid);
    console.log('✓ Usuário Firebase deletado:', uid);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error.message);
    return false;
  }
}

// ─── Atualizar Usuário Firebase ────────────────────────────────────────────
async function updateFirebaseUser(uid, updates) {
  try {
    const userRecord = await firebaseAuth.updateUser(uid, updates);
    console.log('✓ Usuário Firebase atualizado:', uid);
    return userRecord;
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error.message);
    throw error;
  }
}

module.exports = {
  admin,
  firebaseAuth,
  verifyToken,
  getFirebaseUser,
  createFirebaseUser,
  deleteFirebaseUser,
  updateFirebaseUser,
};
