'use strict';

require('dotenv').config();
const { Pool } = require('pg');

// ─── Configuração Pool PostgreSQL ────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Necessário para Supabase
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool:', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✓ Nova conexão PostgreSQL estabelecida');
});

// ─── Teste de Conexão ───────────────────────────────────────────────────────
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✓ PostgreSQL conectado com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar PostgreSQL:', err.message);
    return false;
  }
}

// ─── Inicializar Banco de Dados ─────────────────────────────────────────────
async function initDB() {
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Falha na conexão com PostgreSQL');
    }

    const client = await pool.connect();

    try {
      // Tabela de usuários
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          firebase_uid TEXT UNIQUE,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          password_hash TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de partidas
      await client.query(`
        CREATE TABLE IF NOT EXISTS matches (
          id SERIAL PRIMARY KEY,
          match_id TEXT UNIQUE NOT NULL,
          winner_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          duration INTEGER,
          FOREIGN KEY(winner_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // Tabela de participação em partidas
      await client.query(`
        CREATE TABLE IF NOT EXISTS match_players (
          id SERIAL PRIMARY KEY,
          match_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          position INTEGER,
          score INTEGER DEFAULT 0,
          kills INTEGER DEFAULT 0,
          deaths INTEGER DEFAULT 0,
          survival_time INTEGER DEFAULT 0,
          FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Tabela de estatísticas gerais
      await client.query(`
        CREATE TABLE IF NOT EXISTS player_stats (
          user_id INTEGER PRIMARY KEY,
          total_matches INTEGER DEFAULT 0,
          total_wins INTEGER DEFAULT 0,
          total_kills INTEGER DEFAULT 0,
          total_deaths INTEGER DEFAULT 0,
          win_rate REAL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Criar índices para melhor performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_player_stats_wins ON player_stats(total_wins DESC)
      `);

      console.log('✓ Todas as tabelas inicializadas com sucesso');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Erro ao inicializar DB:', err.message);
    throw err;
  }
}

// ─── Helpers Promise-based para Queries ──────────────────────────────────────
async function dbQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

async function dbRun(sql, params = []) {
  const result = await dbQuery(sql, params);
  return {
    lastID: result.rows[0]?.id || null,
    changes: result.rowCount
  };
}

async function dbGet(sql, params = []) {
  const result = await dbQuery(sql, params);
  return result.rows[0] || null;
}

async function dbAll(sql, params = []) {
  const result = await dbQuery(sql, params);
  return result.rows || [];
}

// ─── Operações de Usuário ───────────────────────────────────────────────────
async function createUser(username, email, passwordHash, avatarUrl = null) {
  const result = await dbRun(
    `INSERT INTO users (username, email, password_hash, avatar_url) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id`,
    [username, email, passwordHash, avatarUrl]
  );
  return result.lastID;
}

async function createUserFromFirebase(firebaseUID, email, displayName = null, photoURL = null) {
  const username = displayName || email.split('@')[0];
  const result = await dbRun(
    `INSERT INTO users (firebase_uid, username, email, avatar_url) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id`,
    [firebaseUID, username, email, photoURL]
  );
  return result.lastID;
}

async function getUserByFirebaseUID(firebaseUID) {
  return dbGet(
    'SELECT * FROM users WHERE firebase_uid = $1',
    [firebaseUID]
  );
}

async function getUserByUsername(username) {
  return dbGet(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
}

async function getUserById(id) {
  return dbGet(
    'SELECT id, username, email, avatar_url, firebase_uid, created_at FROM users WHERE id = $1',
    [id]
  );
}

async function updateUserAvatar(userId, avatarUrl) {
  await dbRun(
    'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [avatarUrl, userId]
  );
}

// ─── Operações de Partidas ──────────────────────────────────────────────────
async function createMatch(matchId, duration) {
  const result = await dbRun(
    'INSERT INTO matches (match_id, duration) VALUES ($1, $2) RETURNING id',
    [matchId, duration]
  );
  return result.lastID;
}

async function addPlayerToMatch(matchId, userId, position, score, kills, deaths, survivalTime) {
  await dbRun(
    `INSERT INTO match_players (match_id, user_id, position, score, kills, deaths, survival_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [matchId, userId, position, score, kills, deaths, survivalTime]
  );
}

async function setMatchWinner(matchId, winnerId) {
  await dbRun(
    'UPDATE matches SET winner_id = $1 WHERE id = $2',
    [winnerId, matchId]
  );
}

async function getMatchHistory(userId, limit = 20) {
  return dbAll(
    `SELECT m.*, mp.position, mp.score, mp.kills, mp.deaths, mp.survival_time
     FROM matches m
     JOIN match_players mp ON m.id = mp.match_id
     WHERE mp.user_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
}

// ─── Operações de Estatísticas ──────────────────────────────────────────────
async function getPlayerStats(userId) {
  let stats = await dbGet(
    'SELECT * FROM player_stats WHERE user_id = $1',
    [userId]
  );
  
  if (!stats) {
    stats = {
      user_id: userId,
      total_matches: 0,
      total_wins: 0,
      total_kills: 0,
      total_deaths: 0,
      win_rate: 0
    };
  }
  
  return stats;
}

async function updatePlayerStats(userId, matchData) {
  console.log('📊 updatePlayerStats:', { userId, matchData });
  
  const stats = await getPlayerStats(userId);
  console.log('📋 Stats atuais:', stats);
  
  const newStats = {
    total_matches: stats.total_matches + 1,
    total_wins: stats.total_wins + (matchData.won ? 1 : 0),
    total_kills: stats.total_kills + (matchData.kills || 0),
    total_deaths: stats.total_deaths + (matchData.deaths || 0),
  };
  newStats.win_rate = newStats.total_wins / newStats.total_matches;

  console.log('🆕 Novos stats:', newStats);

  // Usar UPSERT (INSERT ... ON CONFLICT ... DO UPDATE)
  await dbRun(
    `INSERT INTO player_stats (user_id, total_matches, total_wins, total_kills, total_deaths, win_rate)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(user_id) DO UPDATE SET
     total_matches = EXCLUDED.total_matches,
     total_wins = EXCLUDED.total_wins,
     total_kills = EXCLUDED.total_kills,
     total_deaths = EXCLUDED.total_deaths,
     win_rate = EXCLUDED.win_rate,
     updated_at = CURRENT_TIMESTAMP`,
    [userId, newStats.total_matches, newStats.total_wins, newStats.total_kills, newStats.total_deaths, newStats.win_rate]
  );
  
  console.log('✓ Stats salvas no DB para userId:', userId);
}

async function getGlobalLeaderboard(limit = 50) {
  return dbAll(
    `SELECT u.id, u.username, u.avatar_url, ps.total_wins, ps.total_kills, ps.total_matches, ps.win_rate
     FROM player_stats ps
     JOIN users u ON ps.user_id = u.id
     ORDER BY ps.total_wins DESC, ps.win_rate DESC
     LIMIT $1`,
    [limit]
  );
}

// ─── Cleanup ────────────────────────────────────────────────────────────────
process.on('exit', async () => {
  await pool.end();
  console.log('✓ Pool de conexões fechado');
});

module.exports = {
  pool,
  initDB,
  // Users
  createUser,
  createUserFromFirebase,
  getUserByFirebaseUID,
  getUserByUsername,
  getUserById,
  updateUserAvatar,
  // Matches
  createMatch,
  addPlayerToMatch,
  setMatchWinner,
  getMatchHistory,
  getPlayerStats,
  updatePlayerStats,
  getGlobalLeaderboard,
};
