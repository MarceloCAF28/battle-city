'use strict';

const Parse = require('parse');

// Configurar Back4App
const appId = process.env.BACK4APP_APP_ID || 'M44vzQx2pIIofQDNpghpHl0J3n4LKF70BiKNKuED';
const jsKey = process.env.BACK4APP_JS_KEY || 'ZVNueKhFqeuR5OkAFd6yeUSNbzlqXmjRySHXslzI';
const clientKey = process.env.BACK4APP_CLIENT_KEY || 'CjZBJPILYnqXmrlSUMcTLtEACHbmUe6Y1mrIwPb1';
const serverUrl = 'https://parseapi.back4app.com';

console.log('🔧 Inicializando Back4App...');
console.log(`   App ID: ${appId.substring(0, 8)}...`);
console.log(`   Server: ${serverUrl}`);

try {
  Parse.initialize(appId, jsKey, clientKey);
  Parse.serverURL = serverUrl;
  console.log('✓ Parse inicializado com sucesso');
} catch (err) {
  console.error('❌ Erro ao inicializar Parse:', err.message);
  process.exit(1);
}

// Registrar classes Parse
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

console.log('✓ Classes Parse registradas');

module.exports = Parse;
