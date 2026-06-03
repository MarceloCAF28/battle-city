'use strict';
// ─── auth.js ─ Client-side authentication ─────────────────────────────────

let currentToken = null;
let currentUserId = null;
let currentUsername = null;

// Firebase client imports (será carregado dinamicamente)
let firebaseAuth = null;
let signInWithCustomToken = null;

// ─── Inicializar Firebase Client ────────────────────────────────────────────
async function initFirebaseClient() {
  try {
    if (firebaseAuth) return; // Já inicializado
    
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    const { getAuth, signInWithCustomToken: signIn } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    
    signInWithCustomToken = signIn;
    
    const firebaseConfig = {
      apiKey: "AIzaSyCFl9ooAgteF4lA2KNB0MMkOMs-nOjN-80",
      authDomain: "battle-city-bd36e.firebaseapp.com",
      projectId: "battle-city-bd36e",
      storageBucket: "battle-city-bd36e.firebasestorage.app",
      messagingSenderId: "1085542519227",
      appId: "1:1085542519227:web:b8c0b33c32cd74e550f49e",
      measurementId: "G-SRGGGDY32X"
    };
    
    const app = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(app);
    
    console.log('✓ Firebase Client inicializado');
  } catch (err) {
    console.error('❌ Erro ao inicializar Firebase Client:', err);
  }
}

// ─── Converter Custom Token em ID Token ────────────────────────────────────
async function convertCustomTokenToIdToken(customToken) {
  try {
    if (!firebaseAuth || !signInWithCustomToken) {
      await initFirebaseClient();
    }
    
    const userCredential = await signInWithCustomToken(firebaseAuth, customToken);
    const idToken = await userCredential.user.getIdToken();
    
    console.log('✓ Token convertido com sucesso');
    return idToken;
  } catch (err) {
    console.error('❌ Erro ao converter token:', err);
    throw err;
  }
}

// ─── Screens ────────────────────────────────────────────────────────────────
const authScreens = {
  auth: document.getElementById('screen-auth'),
  lobby: document.getElementById('screen-lobby'),
  game: document.getElementById('screen-game'),
  overlay: document.getElementById('screen-overlay'),
  scoreboard: document.getElementById('screen-scoreboard'),
  leaderboard: document.getElementById('screen-leaderboard'),
};

function showAuthScreen(name) {
  for (const [k, el] of Object.entries(authScreens)) {
    el.style.display = k === name ? 'flex' : 'none';
  }
}

// ─── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar Firebase Client
  initFirebaseClient();

  // Carrega token do localStorage se existir
  const savedToken = localStorage.getItem('battle-city-token');
  if (savedToken) {
    currentToken = savedToken;
    currentUserId = localStorage.getItem('battle-city-userId');
    currentUsername = localStorage.getItem('battle-city-username');
    
    initSocket();
    
    try {
      await loadUserStats(); // Tenta carregar os dados do usuário
      showAuthScreen('lobby');
    } catch (err) {
      console.error('Token antigo ou inválido detectado. Limpando sessão...');
      document.getElementById('btn-logout').click();
    }
    
  } else {
    showAuthScreen('auth');
  }

  setupAuthTabButtons();
  setupAuthButtons();
  setupLogoutButton();
  setupLeaderboardButton();
  
  // CHAMADA ADICIONADA: Ativa os ouvintes de clique do avatar assim que a página carregar
  setupAvatarButtons();
});

// ─── Auth Tabs ──────────────────────────────────────────────────────────────
function setupAuthTabButtons() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tabName}`).classList.add('active');
    });
  });
}

// ─── Login / Registro ───────────────────────────────────────────────────────
function setupAuthButtons() {
  // Login button
  document.getElementById('btn-login').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      showAuthError('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      const idToken = await convertCustomTokenToIdToken(data.token);

      currentToken = idToken;
      currentUserId = data.userId;
      currentUsername = data.username;

      localStorage.setItem('battle-city-token', currentToken);
      localStorage.setItem('battle-city-userId', currentUserId);
      localStorage.setItem('battle-city-username', currentUsername);

      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
      document.getElementById('auth-error-msg').textContent = '';

      initSocket();
      loadUserStats();
      showAuthScreen('lobby');
    } catch (err) {
      showAuthError(err.message);
    }
  });

  // Register button
  document.getElementById('btn-register').addEventListener('click', async () => {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const password2 = document.getElementById('register-password2').value;

    if (!username || !password) {
      showAuthError('Username e Senha são obrigatórios');
      return;
    }

    if (password !== password2) {
      showAuthError('Senhas não conferem');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email: email || null, password }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      const idToken = await convertCustomTokenToIdToken(data.token);

      currentToken = idToken;
      currentUserId = data.userId;
      currentUsername = data.username;

      localStorage.setItem('battle-city-token', currentToken);
      localStorage.setItem('battle-city-userId', currentUserId);
      localStorage.setItem('battle-city-username', currentUsername);

      document.getElementById('register-username').value = '';
      document.getElementById('register-email').value = '';
      document.getElementById('register-password').value = '';
      document.getElementById('register-password2').value = '';
      document.getElementById('auth-error-msg').textContent = '';

      initSocket();
      loadUserStats();
      showAuthScreen('lobby');
    } catch (err) {
      showAuthError(err.message);
    }
  });

  document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
  });
  document.getElementById('register-password2').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-register').click();
  });
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error-msg');
  el.textContent = msg;
  el.style.opacity = 1;
  setTimeout(() => { el.style.opacity = 0; }, 4000);
}

// ─── User Info & Stats ──────────────────────────────────────────────────────
function setupLogoutButton() {
  document.getElementById('btn-logout').addEventListener('click', () => {
    currentToken = null; //
    currentUserId = null; //
    currentUsername = null; //
    localStorage.removeItem('battle-city-token'); //
    localStorage.removeItem('battle-city-userId'); //
    localStorage.removeItem('battle-city-username'); //
    
    // CORREÇÃO: Limpa a imagem do elemento HTML imediatamente ao deslogar
    const lobbyAvatar = document.getElementById('lobby-avatar');
    if (lobbyAvatar) {
      lobbyAvatar.src = 'assets/default-avatar.png';
    }
    
    showAuthScreen('auth'); //
  });
}

async function loadUserStats() {
  try {
    const res = await fetch('/api/stats', { //
      headers: { 'Authorization': `Bearer ${currentToken}` }, //
    });
    const data = await res.json(); //
    if (!data.ok) throw new Error(data.error); //

    const stats = data.stats; //
    document.getElementById('username-display').textContent = currentUsername; //
    document.getElementById('stat-wins').textContent = stats.total_wins; //
    document.getElementById('stat-kills').textContent = stats.total_kills; //
    document.getElementById('stat-winrate').textContent = (stats.win_rate * 100).toFixed(1) + '%'; //
    
    // CORREÇÃO: Adicionando bloco 'else' para limpar a imagem anterior
    if (data.user && data.user.avatar_url) {
      document.getElementById('lobby-avatar').src = data.user.avatar_url; //
    } else {
      document.getElementById('lobby-avatar').src = 'assets/default-avatar.png';
    }
  } catch (err) {
    console.error('Erro ao carregar stats:', err); //
    throw err; //
  }
}

// ─── Leaderboard ────────────────────────────────────────────────────────────
function setupLeaderboardButton() {
  document.getElementById('btn-leaderboard').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/leaderboard?limit=20');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      const lb = data.leaderboard;
      let html = '<table class="lb-table"><tr><th>Pos</th><th>Player</th><th>Vitórias</th><th>Taxa</th><th>Eliminations</th></tr>';
      lb.forEach((p, i) => {
        html += `<tr><td>${i+1}</td><td>${p.username}</td><td>${p.total_wins}</td><td>${(p.win_rate*100).toFixed(1)}%</td><td>${p.total_kills}</td></tr>`;
      });
      html += '</table>';

      document.getElementById('leaderboard-content').innerHTML = html;
      showAuthScreen('leaderboard');
    } catch (err) {
      console.error('Erro ao carregar leaderboard:', err);
    }
  });

  document.getElementById('btn-back-from-lb').addEventListener('click', () => {
    showAuthScreen('lobby');
  });
}

// ─── Avatar Upload Logic (FUNÇÃO ADICIONADA) ───────────────────────────────
function setupAvatarButtons() {
  const btnTrigger = document.getElementById('btn-trigger-avatar');
  const avatarInput = document.getElementById('avatar-input');
  const lobbyAvatar = document.getElementById('lobby-avatar');

  if (!btnTrigger || !avatarInput) return;

  btnTrigger.addEventListener('click', () => {
    avatarInput.click();
  });

  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      btnTrigger.textContent = 'Subindo...';
      btnTrigger.disabled = true;

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${currentToken}`
        },
        body: formData
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      if (lobbyAvatar) {
        lobbyAvatar.src = data.avatarUrl;
      }
      console.log('✓ Foto de perfil atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao fazer upload do avatar:', err);
      alert('Erro ao mudar foto: ' + err.message);
    } finally {
      btnTrigger.textContent = 'Mudar Foto';
      btnTrigger.disabled = false;
    }
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function showErrorLobby(msg) {
  const el = document.getElementById('lobby-error-msg');
  el.textContent = msg;
  el.style.opacity = 1;
  setTimeout(() => { el.style.opacity = 0; }, 3000);
}