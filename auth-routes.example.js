/**
 * Exemplo de rotas de autenticação usando Firebase
 * Copie para server.js ou crie um arquivo separado e importe
 */

const express = require('express');
const { syncUserToDatabase } = require('./auth');
const { getFirebaseUser } = require('./firebase');
const db = require('./db');

const router = express.Router();

// ─── Callback de Autenticação Firebase (Backend) ────────────────────────────
/**
 * Após login/registro no Firebase (frontend), 
 * chame este endpoint para sincronizar o usuário com o banco
 * 
 * POST /api/auth/firebase-callback
 * Body: { token: "ID_TOKEN_DO_FIREBASE" }
 */
router.post('/firebase-callback', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ ok: false, error: 'Token ausente' });
    }

    // Obter usuário Firebase
    // Nota: Aqui você precisa decodificar o token manualmente ou usar admin SDK
    // Por enquanto, o usuário será sincronizado quando usar os endpoints autenticados
    
    res.json({
      ok: true,
      message: 'Sincronização feita automaticamente'
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ─── Obter Perfil do Usuário ────────────────────────────────────────────────
/**
 * GET /api/auth/profile
 * Headers: Authorization: Bearer {ID_TOKEN_DO_FIREBASE}
 */
router.get('/profile', async (req, res) => {
  try {
    // Middleware de autenticação será adicionado
    const userId = req.userId; // Vem do middleware authMiddleware
    
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Não autenticado' });
    }

    // Buscar usuário no banco
    const user = await db.getUserById(userId);

    if (!user) {
      return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        firebaseUID: user.firebase_uid,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ─── Leaderboard (Público) ──────────────────────────────────────────────────
/**
 * GET /api/auth/leaderboard?limit=50
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const leaderboard = await db.getGlobalLeaderboard(limit);

    res.json({
      ok: true,
      leaderboard: leaderboard.map(entry => ({
        userId: entry.id,
        username: entry.username,
        avatar: entry.avatar_url,
        wins: entry.total_wins,
        kills: entry.total_kills,
        matches: entry.total_matches,
        winRate: (entry.win_rate * 100).toFixed(2) + '%',
      }))
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ─── Histórico de Partidas ──────────────────────────────────────────────────
/**
 * GET /api/auth/match-history?limit=20
 * Headers: Authorization: Bearer {ID_TOKEN_DO_FIREBASE}
 */
router.get('/match-history', async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Não autenticado' });
    }

    const limit = req.query.limit || 20;
    const history = await db.getMatchHistory(userId, limit);

    res.json({
      ok: true,
      matches: history
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ─── Estatísticas do Jogador ────────────────────────────────────────────────
/**
 * GET /api/auth/stats
 * Headers: Authorization: Bearer {ID_TOKEN_DO_FIREBASE}
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Não autenticado' });
    }

    const stats = await db.getPlayerStats(userId);

    res.json({
      ok: true,
      stats: {
        totalMatches: stats.total_matches,
        totalWins: stats.total_wins,
        totalKills: stats.total_kills,
        totalDeaths: stats.total_deaths,
        winRate: (stats.win_rate * 100).toFixed(2) + '%',
      }
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;

/**
 * ─── COMO USAR NO SERVER.JS ────────────────────────────────────────────────
 * 
 * const { authMiddleware } = require('./auth');
 * const authRoutes = require('./auth-routes');
 * 
 * // Aplicar middleware a rotas que precisam autenticação
 * app.use('/api/auth/profile', authMiddleware);
 * app.use('/api/auth/match-history', authMiddleware);
 * app.use('/api/auth/stats', authMiddleware);
 * 
 * app.use('/api/auth', authRoutes);
 * 
 * ─── FLUXO DE AUTENTICAÇÃO (Frontend) ──────────────────────────────────────
 * 
 * 1. Import Firebase client:
 *    import { loginUser, getCurrentToken } from './firebase-client.js';
 * 
 * 2. User faz login:
 *    const user = await loginUser(email, password);
 *    console.log('Token:', user.token);
 * 
 * 3. Enviar token em requisições:
 *    fetch('/api/auth/profile', {
 *      headers: { 'Authorization': `Bearer ${token}` }
 *    })
 * 
 * 4. Backend valida token Firebase e sincroniza usuário no banco
 */
