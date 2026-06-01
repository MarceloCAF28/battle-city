'use strict';

const Parse = require('./back4app-config');
const jwt = require('jsonwebtoken');

// Secret para JWT - em produção, usar variável de ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-muito-seguro-aqui-mude-em-producao';

// ─── JWT Helpers ────────────────────────────────────────────────────────────
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// ─── Registro ───────────────────────────────────────────────────────────────
async function register(username, email, password) {
  try {
    // Validações
    if (!username || username.length < 3) {
      throw new Error('Username deve ter pelo menos 3 caracteres');
    }
    if (!password || password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    console.log(`📝 Registrando usuário: ${username}`);

    const user = new Parse.User();
    user.set('username', username);
    user.set('email', email || null);
    user.set('password', password);
    user.set('displayName', username);

    await user.save();

    const token = generateToken(user.id);

    console.log(`✓ Usuário registrado com sucesso: ${username} (ID: ${user.id})`);

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      token,
    };
  } catch (err) {
    console.error(`❌ Erro ao registrar ${username}:`, err.message);
    if (err.message.includes('already exists')) {
      throw new Error('Usuário já existe');
    }
    throw new Error(`Não foi possível registrar: ${err.message}`);
  }
}

// ─── Login ──────────────────────────────────────────────────────────────────
async function login(username, password) {
  try {
    const user = await Parse.User.logIn(username, password);
    const token = generateToken(user.id);

    console.log(`✓ Login bem-sucedido: ${username}`);

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      token,
    };
  } catch (err) {
    console.error(`❌ Erro ao fazer login ${username}:`, err.message);
    throw new Error('Usuário ou senha inválidos');
  }
}

// ─── Logout ─────────────────────────────────────────────────────────────────
async function logout(sessionToken) {
  try {
    await Parse.User.logOut();
    console.log(`✓ Logout bem-sucedido`);
  } catch (err) {
    console.error('❌ Erro ao fazer logout:', err.message);
  }
}

// ─── Middleware de Autenticação ─────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Token ausente' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ ok: false, error: 'Token inválido ou expirado' });
  }

  req.userId = decoded.userId;
  next();
}

// ─── Socket.io Auth Middleware ──────────────────────────────────────────────
function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Token ausente'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Token inválido ou expirado'));
  }

  socket.userId = decoded.userId;
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  register,
  login,
  logout,
  authMiddleware,
  socketAuthMiddleware,
};
