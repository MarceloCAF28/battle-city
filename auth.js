'use strict';

const { verifyToken, getFirebaseUser, createCustomToken } = require('./firebase');
const db = require('./db');

// ─── Middleware de Autenticação Firebase (Express) ────────────────────────
async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;

    if (!token) {
      return res.status(401).json({ ok: false, error: 'Token ausente' });
    }

    // Verificar token Firebase
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ ok: false, error: 'Token inválido ou expirado' });
    }

    // Adicionar informações do usuário no request
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    
    next();
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error.message);
    res.status(500).json({ ok: false, error: 'Erro ao autenticar' });
  }
}

// ─── Middleware Socket.io com Firebase ──────────────────────────────────────
async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token ausente'));
    }

    // Verificar token Firebase
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return next(new Error('Token inválido'));
    }

    // Adicionar informações do usuário no socket
    socket.userId = decodedToken.uid;
    socket.userEmail = decodedToken.email;
    
    next();
  } catch (error) {
    console.error('❌ Erro no middleware Socket.io:', error.message);
    next(new Error('Erro ao autenticar'));
  }
}

// ─── Verificar Token (para uso direto) ──────────────────────────────────────
async function verifyFirebaseToken(token) {
  try {
    const decodedToken = await verifyToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
}

// ─── Sincronizar Usuário Firebase com Banco de Dados ────────────────────────
async function syncUserToDatabase(firebaseUser) {
  try {
    // Verificar se usuário já existe no banco
    const existingUser = await db.getUserByFirebaseUID(firebaseUser.uid);

    if (existingUser) {
      // Atualizar avatar se houver
      if (firebaseUser.photoURL) {
        await db.updateUserAvatar(existingUser.id, firebaseUser.photoURL);
      }
      return existingUser;
    }

    // Criar novo usuário no banco
    const userId = await db.createUserFromFirebase(
      firebaseUser.uid,
      firebaseUser.email,
      firebaseUser.displayName,
      firebaseUser.photoURL
    );

    return {
      id: userId,
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email,
      username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      avatar_url: firebaseUser.photoURL,
    };
  } catch (error) {
    console.error('❌ Erro ao sincronizar usuário:', error.message);
    throw error;
  }
}

// ─── Registrar Novo Usuário ────────────────────────────────────────────────
async function register(username, email, password) {
  try {
    if (!username || !email || !password) {
      throw new Error('Username, email e password são obrigatórios');
    }

    // Gerar hash da senha com bcryptjs
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário no Firebase Admin
    const { createFirebaseUser } = require('./firebase');
    const firebaseUser = await createFirebaseUser(email, password, username);

    // Criar usuário no banco de dados com password hash
    const userId = await db.createUserWithPassword(
      firebaseUser.uid,
      username,
      email,
      passwordHash
    );

    // Gerar custom token Firebase (válido para verificação no servidor)
    const token = await createCustomToken(firebaseUser.uid);

    return {
      token,
      userId,
      firebaseUID: firebaseUser.uid,
      username,
      email,
    };
  } catch (error) {
    console.error('❌ Erro ao registrar:', error.message);
    throw error;
  }
}

// ─── Login de Usuário ──────────────────────────────────────────────────────
async function login(username, password) {
  try {
    if (!username || !password) {
      throw new Error('Username e password são obrigatórios');
    }

    // Buscar usuário no banco de dados
    const user = await db.getUserByUsername(username);
    if (!user) {
      console.log('❌ Usuário não encontrado:', username);
      throw new Error('Usuário não encontrado');
    }

    // Verificar se tem password_hash
    if (!user.password_hash) {
      console.log('❌ Senha não definida para usuário:', username);
      throw new Error('Usuário não tem senha definida');
    }

    // Verificar senha com bcryptjs
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('❌ Senha incorreta para:', username);
      throw new Error('Senha incorreta');
    }

    // Gerar custom token Firebase (válido para verificação no servidor)
    const token = await createCustomToken(user.firebase_uid);

    console.log('✓ Login bem-sucedido:', username);
    return {
      token,
      userId: user.id,
      firebaseUID: user.firebase_uid,
      username: user.username,
      email: user.email,
    };
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    throw error;
  }
}

module.exports = {
  register,
  login,
  verifyToken: verifyFirebaseToken,
  authMiddleware,
  socketAuthMiddleware,
  syncUserToDatabase,
};

