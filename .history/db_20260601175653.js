'use strict';

const Parse = require('./back4app-config');

// ─── Classes Parse ────────────────────────────────────────────────────────────

class PlayerStats extends Parse.Object {
  constructor() {
    super('PlayerStats');
  }
}
Parse.Object.registerSubclass('PlayerStats', PlayerStats);

class Match extends Parse.Object {
  constructor() {
    super('Match');
  }
}
Parse.Object.registerSubclass('Match', Match);

class MatchPlayer extends Parse.Object {
  constructor() {
    super('MatchPlayer');
  }
}
Parse.Object.registerSubclass('MatchPlayer', MatchPlayer);

// ─── Inicializar ────────────────────────────────────────────────────────
async function initDB() {
  try {
    console.log('🗄️  Inicializando banco de dados Back4App...');
    
    // Criar classes se não existirem
    await createClassesIfNotExist();
    
    // Testar conexão
    const testObject = new Parse.Object('TestConnection');
    testObject.set('test', true);
    testObject.set('timestamp', new Date());
    await testObject.save();
    await testObject.destroy();
    
    console.log('✓ Conexão com Back4App estabelecida com sucesso');
    return Promise.resolve();
  } catch (err) {
    console.error('❌ Erro ao inicializar Back4App:', err);
    return Promise.reject(err);
  }
}

async function createClassesIfNotExist() {
  try {
    const classNames = ['PlayerStats', 'Match', 'MatchPlayer'];
    
    for (const className of classNames) {
      try {
        const query = new Parse.Query(className);
        await query.first();
        console.log(`  ✓ Classe ${className} existe`);
      } catch (err) {
        // Classe não existe, criar objeto dummy para forçar criação
        console.log(`  📝 Criando classe ${className}...`);
        const obj = new Parse.Object(className);
        obj.set('_initialized', true);
        obj.set('createdAt', new Date());
        await obj.save();
        await obj.destroy();
        console.log(`  ✓ Classe ${className} criada`);
      }
    }
  } catch (err) {
    console.error('❌ Erro ao criar classes:', err.message);
    throw err;
  }
}

// ─── Auth Functions ──────────────────────────────────────────────────────────

async function createUser(username, email, password) {
  try {
    const user = new Parse.User();
    user.set('username', username);
    user.set('email', email);
    user.set('password', password);
    user.set('displayName', username);
    
    await user.save();
    console.log(`✓ Usuário criado: ${username}`);
    return { userId: user.id, username: user.username, email: user.email };
  } catch (err) {
    console.error(`❌ Erro ao criar usuário ${username}:`, err.message);
    throw new Error(`Não foi possível criar usuário: ${err.message}`);
  }
}

async function authenticateUser(username, password) {
  try {
    const user = await Parse.User.logIn(username, password);
    console.log(`✓ Usuário autenticado: ${username}`);
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      sessionToken: user.getSessionToken(),
    };
  } catch (err) {
    console.error(`❌ Erro ao autenticar ${username}:`, err.message);
    throw new Error('Usuário ou senha inválidos');
  }
}

async function getUserById(userId) {
  try {
    const query = new Parse.Query(Parse.User);
    const user = await query.get(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
    };
  } catch (err) {
    console.error(`❌ Erro ao obter usuário ${userId}:`, err.message);
    throw err;
  }
}

// ─── Stats Functions ─────────────────────────────────────────────────────────

async function getOrCreatePlayerStats(userId) {
  try {
    const query = new Parse.Query('PlayerStats');
    query.equalTo('userId', userId);
    let stats = await query.first();

    if (!stats) {
      stats = new PlayerStats();
      stats.set('userId', userId);
      stats.set('totalMatches', 0);
      stats.set('totalWins', 0);
      stats.set('totalKills', 0);
      stats.set('totalDeaths', 0);
      stats.set('winRate', 0);
      await stats.save();
      console.log(`✓ Stats criados para usuário: ${userId}`);
    }

    return {
      userId: stats.get('userId'),
      totalMatches: stats.get('totalMatches') || 0,
      totalWins: stats.get('totalWins') || 0,
      totalKills: stats.get('totalKills') || 0,
      totalDeaths: stats.get('totalDeaths') || 0,
      winRate: stats.get('winRate') || 0,
    };
  } catch (err) {
    console.error(`❌ Erro ao obter stats ${userId}:`, err.message);
    throw err;
  }
}

async function updatePlayerStats(userId, matchData) {
  try {
    const query = new Parse.Query('PlayerStats');
    query.equalTo('userId', userId);
    let stats = await query.first();

    if (!stats) {
      await getOrCreatePlayerStats(userId);
      stats = await query.first();
    }

    stats.increment('totalMatches', 1);
    if (matchData.won) stats.increment('totalWins', 1);
    stats.increment('totalKills', matchData.kills || 0);
    stats.increment('totalDeaths', matchData.deaths || 0);

    const totalMatches = (stats.get('totalMatches') || 0);
    const totalWins = stats.get('totalWins') || 0;
    const newWinRate = (totalWins / totalMatches) * 100;
    stats.set('winRate', newWinRate.toFixed(2));

    await stats.save();
    console.log(`✓ Stats atualizadas para usuário: ${userId}`);
    return stats.toJSON();
  } catch (err) {
    console.error(`❌ Erro ao atualizar stats ${userId}:`, err.message);
    throw err;
  }
}

async function getPlayerStats(userId) {
  try {
    return await getOrCreatePlayerStats(userId);
  } catch (err) {
    console.error(`❌ Erro ao obter stats ${userId}:`, err.message);
    throw err;
  }
}

// ─── Leaderboard Functions ───────────────────────────────────────────────────

async function getGlobalLeaderboard(limit = 50) {
  try {
    const query = new Parse.Query('PlayerStats');
    query.descending('totalWins');
    query.limit(limit);
    const results = await query.find();

    const leaderboard = await Promise.all(
      results.map(async (stats) => {
        try {
          const user = await getUserById(stats.get('userId'));
          return {
            rank: null,
            userId: user.id,
            username: user.username,
            totalMatches: stats.get('totalMatches') || 0,
            totalWins: stats.get('totalWins') || 0,
            totalKills: stats.get('totalKills') || 0,
            totalDeaths: stats.get('totalDeaths') || 0,
            winRate: stats.get('winRate') || 0,
          };
        } catch (err) {
          console.error(`Erro ao obter info do usuário ${stats.get('userId')}`);
          return null;
        }
      })
    );

    return leaderboard
      .filter((item) => item !== null)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  } catch (err) {
    console.error('❌ Erro ao obter leaderboard:', err.message);
    throw err;
  }
}

// ─── Match History ───────────────────────────────────────────────────────────

async function saveMatchResult(matchId, winnerId, players) {
  try {
    const match = new Match();
    match.set('matchId', matchId);
    match.set('winnerId', winnerId);
    match.set('players', players);
    match.set('createdAt', new Date());
    await match.save();
    console.log(`✓ Match ${matchId} salvo`);
    return { id: match.id, matchId };
  } catch (err) {
    console.error(`❌ Erro ao salvar match ${matchId}:`, err.message);
    throw err;
  }
}

async function getMatchHistory(userId, limit = 20) {
  try {
    const query = new Parse.Query('MatchPlayer');
    query.equalTo('userId', userId);
    query.descending('createdAt');
    query.limit(limit);
    const results = await query.find();

    return results.map((record) => ({
      matchId: record.get('matchId'),
      position: record.get('position'),
      score: record.get('score'),
      kills: record.get('kills'),
      deaths: record.get('deaths'),
      survivalTime: record.get('survivalTime'),
      createdAt: record.createdAt,
    }));
  } catch (err) {
    console.error(`❌ Erro ao obter histórico ${userId}:`, err.message);
    throw err;
  }
}

module.exports = {
  initDB,
  createUser,
  authenticateUser,
  getUserById,
  getPlayerStats,
  updatePlayerStats,
  getGlobalLeaderboard,
  saveMatchResult,
  getMatchHistory,
};
