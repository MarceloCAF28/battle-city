'use strict';
// ─── game.js ─ Client-side rendering + interpolation + input ─────────────────

let socket = null;

function initSocket() {
  if (socket) return; // Já inicializado
  
  socket = io({
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    auth: {
      token: currentToken,
    },
  });

  // Setup socket event listeners
  setupSocketListeners();
}

function setupSocketListeners() {
  socket.on('state', (state) => {
    snapA = snapB;
    snapB = { time: Date.now(), state };
  });

  socket.on('tileDestroyed', ({ row, col }) => {
    if (map && map[row]) {
      map[row][col] = 0;
    }
  });

  socket.on('roundOver', ({ winnerId, players }) => {
    gameRunning = false; //
    
    // Como o servidor já envia a lista ordenada por posição, 
    // podemos usar a ordem que veio diretamente do servidor!
    const ranking = players; 
    
    // Encontrar meus dados no array de players
    const myPlayerData = players.find(p => p.id === myId); //
    if (myPlayerData) {
      myMatchData.kills = myPlayerData.kills || 0; //
      myMatchData.deaths = myPlayerData.deaths || 0; //
      myMatchData.score = myPlayerData.score || 0; //
    }
    
    myMatchData.survived = true; //
    myMatchData.won = winnerId === myId; //
    myMatchData.position = ranking.findIndex(p => p.id === myId) + 1; //
    
    const scoreboard = {
      winnerId, //
      players: ranking.map((p, index) => ({
        id: p.id, //
        // CORREÇÃO AQUI: Usa o username real enviado pelo servidor, se não houver, usa o fallback de cor
        username: p.username || `Player_${p.color}`, 
        score: p.score || 0, //
        kills: p.kills || 0, //
        deaths: p.deaths || 0, //
        position: p.position || (index + 1), // Usa a posição calculada pelo servidor
      })),
    };

    // Já está chamando a função aqui, não precisa mudar!
    setTimeout(() => showScoreboard(scoreboard), 500); //
  });

  socket.on('roundReset', ({ map: newMap }) => {
    map = newMap;
    myMatchData = { kills: 0, deaths: 0, score: 0, position: 0, won: false, survivalTime: Date.now() };
    hideOverlay();
  });

  // Error handlers
  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
    showErrorLobby('Erro ao conectar: ' + err.message);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
    showErrorLobby('Erro no socket: ' + err);
  });

  socket.on('connect', () => {
    console.log('✓ Socket conectado com ID:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('✗ Socket desconectado');
  });
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TILE       = 32;
const TANK_SIZE  = 28;
const MAP_COLS   = 26;
const MAP_ROWS   = 26;
const CANVAS_W   = MAP_COLS * TILE;
const CANVAS_H   = MAP_ROWS * TILE;
const INTERP_MS  = 80;  // interpolation window (ms)

// ─── State ────────────────────────────────────────────────────────────────────
let myId      = null;
let myColor   = null;
let roomId    = null;
let currentRoomId = null; // Para compatibilidade com scoreboard.js
let map       = null;
let gameRunning = false;
let myMatchData = null; // Armazena dados da partida do jogador

// Snapshot ring buffer for interpolation
let snapA = null, snapB = null;

// Inputs
const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false,
               w:false, a:false, s:false, d:false, W:false, A:false, S:false, D:false, ' ':false };
let lastInputSent = '';
let inputInterval = null;

// Canvas
const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
canvas.width  = CANVAS_W;
canvas.height = CANVAS_H;

const spritesheet = new Image();
spritesheet.src = 'assets/spritesheet.png';
ctx.imageSmoothingEnabled = false; // Mantém os pixels nítidos (Retro)

const SPRITE_MAP = {
  // Cenário (16x16 pixels na folha original)
  brick: { x: 256, y: 0,  w: 16, h: 16 },
  steel: { x: 256, y: 16, w: 16, h: 16 },
  water: { x: 256, y: 32, w: 16, h: 16 },
  bush:  { x: 272, y: 32, w: 16, h: 16 },
  
  // Tanque Amarelo (Você)
  tank_yellow: {
    up:    { x: 0,  y: 0, w: 16, h: 16 },
    left:  { x: 32, y: 0, w: 16, h: 16 },
    down:  { x: 64, y: 0, w: 16, h: 15 },
    right: { x: 96, y: 0, w: 16, h: 16 }
  },
  // Tanque Verde (Outros Jogadores)
  tank_green: {
    up:    { x: 0,  y: 128, w: 16, h: 16 },
    left:  { x: 32, y: 128, w: 16, h: 16 },
    down:  { x: 64, y: 128, w: 16, h: 15 },
    right: { x: 96, y: 128, w: 16, h: 16 }
  }
};

// Sprite cache
const spriteCache = {};

// ─── Screens ─────────────────────────────────────────────────────────────────
const screens = {
  lobby:   document.getElementById('screen-lobby'),
  game:    document.getElementById('screen-game'),
  overlay: document.getElementById('screen-overlay'),
  scoreboard: document.getElementById('screen-scoreboard'),
};

function showScreen(name) {
  for (const [k, el] of Object.entries(screens)) el.style.display = k === name ? 'flex' : 'none';
}

// ─── Lobby Logic ─────────────────────────────────────────────────────────────
document.getElementById('btn-create').addEventListener('click', () => {
  socket.emit('createRoom', {}, (res) => {
    if (!res.ok) return showErrorLobby(res.error);
    initGame(res);
  });
});

document.getElementById('btn-join').addEventListener('click', () => {
  const code = document.getElementById('room-input').value.trim().toUpperCase();
  if (code.length !== 4) return showErrorLobby('Digite um código de 4 letras');
  socket.emit('joinRoom', { roomId: code }, (res) => {
    if (!res.ok) return showErrorLobby(res.error);
    initGame(res);
  });
});

document.getElementById('room-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-join').click();
});

// ─── Game Init ────────────────────────────────────────────────────────────────
function initGame(res) {
  myId    = res.playerId;
  myColor = res.color;
  roomId  = res.roomId;
  currentRoomId = res.roomId; // Também atualiza currentRoomId
  map     = res.map;
  gameRunning = true;
  myMatchData = { kills: 0, deaths: 0, score: 0, position: 0, won: false, survivalTime: Date.now() };
  document.getElementById('room-code').textContent = res.roomId;
  showScreen('game');
  enableGameControls();
  startInputLoop();
  requestAnimationFrame(renderLoop);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function rankPlayers(players, winnerId) {
  // Rankear por kills, depois por deaths
  return [...players].sort((a, b) => {
    if (b.kills !== a.kills) return b.kills - a.kills;
    return a.deaths - b.deaths;
  });
}

// ─── Input ────────────────────────────────────────────────────────────────────
// Handlers de teclado que serão adicionados/removidos
const keydownHandler = (e) => { 
  if (e.key in keys) { 
    keys[e.key] = true; 
    e.preventDefault(); 
  } 
};
const keyupHandler = (e) => { 
  if (e.key in keys) keys[e.key] = false; 
};

function enableGameControls() {
  window.addEventListener('keydown', keydownHandler);
  window.addEventListener('keyup', keyupHandler);
}

function disableGameControls() {
  window.removeEventListener('keydown', keydownHandler);
  window.removeEventListener('keyup', keyupHandler);
}

// Mobile controls
document.querySelectorAll('[data-key]').forEach(btn => {
  const key = btn.dataset.key;
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
  btn.addEventListener('touchend',   (e) => { e.preventDefault(); keys[key] = false; });
  btn.addEventListener('mousedown',  () => keys[key] = true);
  btn.addEventListener('mouseup',    () => keys[key] = false);
});

function getInputState() {
  return {
    up:    keys.ArrowUp    || keys.w || keys.W,
    down:  keys.ArrowDown  || keys.s || keys.S,
    left:  keys.ArrowLeft  || keys.a || keys.A,
    right: keys.ArrowRight || keys.d || keys.D,
    fire:  keys[' '],
  };
}

function startInputLoop() {
  inputInterval = setInterval(() => {
    if (!gameRunning) return;
    const inp = getInputState();
    const encoded = JSON.stringify(inp);
    if (encoded !== lastInputSent) {
      socket.emit('input', inp);
      lastInputSent = encoded;
    }
  }, 1000 / 60);
}

// ─── Interpolation ────────────────────────────────────────────────────────────
function interpolatedState() {
  if (!snapB) return null;
  if (!snapA) return snapB.state;
  const now    = Date.now();
  const renderTime = now - INTERP_MS;
  const t = Math.max(0, Math.min(1,
    (renderTime - snapA.time) / (snapB.time - snapA.time)
  ));
  const sA = snapA.state, sB = snapB.state;
  // interpolate player positions
  const players = sB.players.map(pb => {
    const pa = sA.players.find(p => p.id === pb.id);
    if (!pa) return pb;
    return { ...pb, x: lerp(pa.x, pb.x, t), y: lerp(pa.y, pb.y, t) };
  });
  return { ...sB, players };
}

function lerp(a, b, t) { return a + (b - a) * t; }

// ─── Render ───────────────────────────────────────────────────────────────────
let lastTime = 0;

function renderLoop(ts) {
  const dt = ts - lastTime; lastTime = ts;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground();
  
  // 1. Desenha o fundo e blocos normais (tijolo, aço, água)
  if (map) drawMap('background'); 
  
  const state = interpolatedState();
  if (state) {
    drawPowerups(state.powerups);
    drawBullets(state.bullets);
    drawPlayers(state.players); // 2. Desenha os tanques
  }
  
  // 3. Desenha os arbustos por cima de tudo para dar camuflagem!
  if (map) drawMap('foreground'); 
  
  requestAnimationFrame(renderLoop);
}

// ─── Drawing ─────────────────────────────────────────────────────────────────
function drawBackground() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= MAP_COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c*TILE, 0); ctx.lineTo(c*TILE, CANVAS_H); ctx.stroke();
  }
  for (let r = 0; r <= MAP_ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r*TILE); ctx.lineTo(CANVAS_W, r*TILE); ctx.stroke();
  }
}

function drawMap(layer) {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const tile = map[r][c];
      if (tile === 0) continue;
      const x = c * TILE, y = r * TILE;

      if (layer === 'background') {
        if (tile === 1) drawBrick(x, y);
        else if (tile === 2) drawSteel(x, y);
        else if (tile === 3) drawWater(x, y);
      } else if (layer === 'foreground') {
        if (tile === 4) drawBush(x, y);
      }
    }
  }
}

function drawBrick(x, y) {
  ctx.drawImage(spritesheet, SPRITE_MAP.brick.x, SPRITE_MAP.brick.y, 16, 16, x, y, TILE, TILE);
}

function drawSteel(x, y) {
  ctx.drawImage(spritesheet, SPRITE_MAP.steel.x, SPRITE_MAP.steel.y, 16, 16, x, y, TILE, TILE);
}

function drawWater(x, y) {
  ctx.drawImage(spritesheet, SPRITE_MAP.water.x, SPRITE_MAP.water.y, 16, 16, x, y, TILE, TILE);
}

function drawBush(x, y) {
  ctx.drawImage(spritesheet, SPRITE_MAP.bush.x, SPRITE_MAP.bush.y, 16, 16, x, y, TILE, TILE);
}

function drawPlayers(players) {
  for (const p of players) {
    if (!p.alive && !p.disconnected) continue;
    if (p.disconnected) {
      drawDestroyedTank(p);
      continue;
    }
    drawTank(p);
    drawHP(p);
  }
}

function drawTank(p) {
  // Define o grupo de sprites baseado em quem é o dono do tanque
  const spriteGroup = (p.id === myId) ? SPRITE_MAP.tank_yellow : SPRITE_MAP.tank_green;
  
  // Pega a direção correta calculada pelo servidor
  const s = spriteGroup[p.dir] || spriteGroup.up;

  // Desenha o sprite do tanque
  ctx.drawImage(
    spritesheet,
    s.x, s.y, s.w, s.h,
    p.x, p.y, TANK_SIZE, TANK_SIZE
  );

  // Indicador sutil ao redor do seu próprio tanque
  if (p.id === myId) {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x - 2, p.y - 2, TANK_SIZE + 4, TANK_SIZE + 4);
  }

  // Anel do Escudo (Power-up)
  if (p.shield) {
    ctx.strokeStyle = `rgba(100,200,255,${0.5 + 0.3 * Math.sin(Date.now()/200)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x + TANK_SIZE/2, p.y + TANK_SIZE/2, TANK_SIZE/2 + 4, 0, Math.PI*2);
    ctx.stroke();
  }
}

function drawDestroyedTank(p) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.translate(p.x + TANK_SIZE/2, p.y + TANK_SIZE/2);
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.roundRect(-TANK_SIZE/2+2, -TANK_SIZE/2+2, TANK_SIZE-4, TANK_SIZE-4, 3);
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.stroke();
  // X mark
  ctx.strokeStyle = '#f44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6,-6); ctx.lineTo(6,6);
  ctx.moveTo(6,-6);  ctx.lineTo(-6,6);
  ctx.stroke();
  ctx.restore();
}

function drawHP(p) {
  const dotR  = 5;
  const gap   = 4;
  const total = 3;
  const width = total * (dotR*2) + (total-1) * gap;
  const sx    = p.x + TANK_SIZE/2 - width/2 + dotR;
  const sy    = p.y - 12;
  for (let i = 0; i < total; i++) {
    const x = sx + i * (dotR*2 + gap);
    ctx.beginPath();
    ctx.arc(x, sy, dotR, 0, Math.PI*2);
    ctx.fillStyle = i < p.hp ? '#e74' : 'rgba(255,255,255,0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

function drawBullets(bullets) {
  for (const b of bullets) {
    ctx.save();
    ctx.translate(b.x+3, b.y+3);
    // glow
    const grd = ctx.createRadialGradient(0,0,0, 0,0,8);
    grd.addColorStop(0, b.color || '#ffe066');
    grd.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
    // core
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

const POWERUP_COLORS = { shield:'#4ecdc4', repair:'#a8e6cf', extraBullets:'#f7c948' };
const POWERUP_ICONS  = { shield:'🛡', repair:'❤', extraBullets:'⚡' };

function drawPowerups(powerups) {
  const t = Date.now() / 1000;
  for (const pu of powerups) {
    ctx.save();
    const pulse = 1 + 0.08 * Math.sin(t * 3);
    ctx.translate(pu.x + 12, pu.y + 12);
    ctx.scale(pulse, pulse);

    // glow
    ctx.shadowColor = POWERUP_COLORS[pu.type] || '#fff';
    ctx.shadowBlur  = 14;

    // bg
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.roundRect(-12,-12,24,24,6); ctx.fill();

    ctx.strokeStyle = POWERUP_COLORS[pu.type] || '#fff';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // icon
    ctx.font = '14px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(POWERUP_ICONS[pu.type] || '?', 0, 0);

    ctx.restore();
  }
}

// ─── Overlay ─────────────────────────────────────────────────────────────────
function showOverlay(msg, seconds) {
  const el = document.getElementById('screen-overlay');
  el.style.display = 'flex';
  el.querySelector('.overlay-msg').textContent = msg;
  let s = seconds;
  const cd = el.querySelector('.overlay-cd');
  const iv = setInterval(() => {
    cd.textContent = `Próxima rodada em ${s--}s`;
    if (s < 0) clearInterval(iv);
  }, 1000);
}
function hideOverlay() {
  document.getElementById('screen-overlay').style.display = 'none';
}

// ─── Color Utils ─────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return {r,g,b};
}
function lighten(hex, amt) {
  const {r,g,b} = hexToRgb(hex);
  return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
}
function darken(hex, amt) {
  const {r,g,b} = hexToRgb(hex);
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}
