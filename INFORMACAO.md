# 📋 ANÁLISE COMPLETA DO PROJETO BATTLE CITY MULTIPLAYER

## 📖 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura da Aplicação](#arquitetura-da-aplicação)
3. [Dependências (package.json)](#dependências-packagejson)
4. [Backend - Arquivos Raiz](#backend---arquivos-raiz)
5. [Frontend - Arquivos Public](#frontend---arquivos-public)
6. [Arquivos de Configuração](#arquivos-de-configuração)
7. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
8. [Estrutura de Dados](#estrutura-de-dados)

---

## 🎮 Visão Geral

**Battle City Multiplayer** é um clone do jogo clássico Battle City (NES) implementado como uma aplicação web multiplayer em tempo real. 

### Características Principais:
- 👥 **Multiplayer**: Até 6 jogadores simultâneos por sala
- 🔐 **Autenticação**: Firebase Authentication + Custom Tokens
- 💾 **Banco de Dados**: PostgreSQL (Supabase) + Supabase Storage
- ⚡ **Comunicação Real-time**: Socket.io para sincronização de estado
- 🎨 **Interface**: HTML5 Canvas para renderização do jogo
- 📊 **Pontuação**: Sistema de ranking, estatísticas de jogadores

### Stack Tecnológico:
- **Backend**: Node.js + Express + Socket.io
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Firebase Admin SDK (servidor) + Firebase SDK (cliente)
- **Storage**: Supabase Storage para arquivos
- **Hospedagem**: Docker, Heroku/Back4App, Render, Vercel

---

## 🏗️ Arquitetura da Aplicação

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                        │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  index.html + auth.js + game.js + scoreboard.js + style.css │
│  │  - Interface de Autenticação (Login/Registro)              │
│  │  - Lobby para criar/entrar em salas                       │
│  │  - Canvas do jogo (renderização local)                    │
│  │  - Sistema de placares e pontuação                        │
│  └──────────────────────────────────────────────────────────┘ │
│                           ↓ Socket.io                          │
└──────────────────────────────────────────────────────────────┘
                             ↕
┌──────────────────────────────────────────────────────────────┐
│                  SERVIDOR (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  server.js - Lógica Principal do Jogo                    │
│  │  - Game loop (30 ticks/segundo)                          │
│  │  - Gerenciamento de salas                                │
│  │  - Sincronização de estado para todos os clientes        │
│  │  - Detecção de colisões e física                         │
│  │  - Spawning de power-ups                                 │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  auth.js - Middleware de Autenticação                    │
│  │  - Verificação de tokens Firebase                        │
│  │  - Middleware Express e Socket.io                        │
│  │  - Sincronização de usuários com BD                      │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  firebase.js - Integração Firebase Admin                 │
│  │  - Gerenciamento de credenciais                          │
│  │  - Verificação de ID tokens                              │
│  │  - Criação e gerenciamento de usuários                   │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  db.js - Acesso a PostgreSQL (Supabase)                  │
│  │  - Gerenciamento de pool de conexões                     │
│  │  - CRUD de usuários, partidas, estatísticas              │
│  │  - Tabelas: users, matches, match_players, player_stats  │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  supabase.js - Armazenamento de Arquivos                 │
│  │  - Upload/Delete de imagens                              │
│  │  - URLs públicas para recursos                           │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                             ↕
┌──────────────────────────────────────────────────────────────┐
│                  BANCO DE DADOS (PostgreSQL/Supabase)        │
│  - Usuários e Autenticação                                    │
│  - Histórico de Partidas                                      │
│  - Estatísticas de Jogadores                                  │
│  - Dados de Matches                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependências (package.json)

### Dependências de Produção:

| Pacote | Versão | Função |
|--------|--------|--------|
| **express** | ^4.18.2 | Framework web para criar APIs HTTP |
| **socket.io** | ^4.7.5 | Comunicação em tempo real WebSocket |
| **pg** | ^8.11.3 | Cliente PostgreSQL para Node.js |
| **@supabase/supabase-js** | ^2.38.0 | Cliente Supabase (BD + Storage) |
| **firebase-admin** | ^12.0.0 | SDK Firebase no servidor |
| **firebase** | ^10.8.0 | SDK Firebase no cliente (se usado no servidor) |
| **bcryptjs** | ^2.4.3 | Hash de senhas com bcrypt |
| **cors** | ^2.8.5 | Middleware CORS para requisições cruzadas |
| **dotenv** | ^16.3.1 | Carregamento de variáveis de ambiente (.env) |

### Dependências de Desenvolvimento:
| Pacote | Versão | Função |
|--------|--------|--------|
| **nodemon** | ^3.1.0 | Auto-reload ao modificar arquivos (dev) |

### Requisitos:
- **Node.js**: >= 18

### Scripts npm:
```json
{
  "start": "node server.js",              // Inicia servidor em produção
  "dev": "nodemon server.js",              // Inicia com auto-reload
  "build": "echo 'Build complete'",        // Build hook (vazio)
  "heroku-postbuild": "...",               // Build hook para Heroku
  "postinstall": "echo 'Dependencies installed'"
}
```

---

## 🖥️ Backend - Arquivos Raiz

### 📄 **server.js** - Coração da Aplicação

**O que faz:**
- Inicializa servidor Express + Socket.io
- Implementa game loop de 30 ticks/segundo
- Gerencia salas de jogo e players
- Sincroniza estado do jogo para todos os clientes
- Detecta colisões e atualiza mapa
- Gerencia power-ups e respawn

**Componentes Principais:**

#### Constantes de Jogo:
```javascript
TICK_RATE = 30              // 30 atualizações por segundo
TILE = 32                   // Tamanho do tile em pixels
MAP_COLS = 26               // Colunas do mapa
MAP_ROWS = 26               // Linhas do mapa
TANK_SIZE = 28              // Tamanho do tanque
BULLET_SPEED = 16           // Velocidade dos projéteis
TANK_SPEED = 2.2            // Velocidade do tanque
MAX_PLAYERS = 6             // Máximo de jogadores por sala
RESPAWN_DELAY = 3000        // Tempo de respawn (ms)
POWERUP_INTERVAL = 12000    // Intervalo de spawn de power-ups
POWERUP_DURATION = 10000    // Duração dos power-ups
```

#### Mapa do Jogo:
- **Mapa 26x26**: Borda de aço (indestruível) + zonas de tijolos + zonas de aço
- **Valores**: 0 = vazio, 1 = tijolos, 2 = aço
- **Padrão Simétrico**: Clusters de tijolos distribuídos simetricamente

#### Spawns:
- **6 posições de spawn** nos cantos e centro do mapa
- **Cores distintas** para cada jogador: #f7c948, #4ecdc4, #ff6b6b, etc.

#### Endpoints HTTP:
```javascript
GET  /health                    // Health check
POST /api/register              // Registrar novo usuário
POST /api/login                 // Login de usuário
POST /api/match-end             // Salvar dados de partida
GET  /api/leaderboard           // Obter placar de líderes
GET  /api/player-stats/:userId  // Obter estatísticas do jogador
```

#### Eventos Socket.io (Servidor → Cliente):
```javascript
'state'           // Envio do estado completo do jogo
'tileDestroyed'   // Notificação de tile destruído
'roundOver'       // Fim de round com ranking
'roundReset'      // Reset do jogo para nova rodada
'connect_error'   // Erro na conexão
'error'           // Erro geral
```

#### Eventos Socket.io (Cliente → Servidor):
```javascript
'join-room'       // Entrar em sala
'move'            // Movimento do tanque
'shoot'           // Disparar projétil
'playerSpawned'   // Notificar spawn do jogador
'disconnect'      // Desconectar do jogo
```

**Fluxo de Jogo:**
1. Player conecta via Socket.io
2. Escolhe sala (criar ou entrar)
3. Servidor inicia game loop
4. A cada 30ms: atualiza física, detecta colisões, envia estado
5. Clientes recebem estado e renderizam no canvas
6. Quando algum player morre, reinicia após delay
7. Última pessoa viva vence o round

---

### 📄 **db.js** - Gerenciamento de Banco de Dados

**O que faz:**
- Gerencia conexão PostgreSQL com Supabase
- Cria e mantém estrutura de tabelas
- Fornece funções CRUD para usuários, partidas e estatísticas

**Variáveis de Ambiente Necessárias:**
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Tabelas Criadas:**

#### 1. `users` - Usuários do Sistema
```sql
id                SERIAL PRIMARY KEY
firebase_uid      TEXT UNIQUE              -- UID do Firebase
username          TEXT UNIQUE NOT NULL     -- Nome do jogador
email             TEXT UNIQUE              -- Email (opcional)
password_hash     TEXT                     -- Hash da senha (bcrypt)
avatar_url        TEXT                     -- URL do avatar
created_at        TIMESTAMP                -- Data de criação
updated_at        TIMESTAMP                -- Data de atualização
```

#### 2. `matches` - Histórico de Partidas
```sql
id                SERIAL PRIMARY KEY
match_id          TEXT UNIQUE NOT NULL     -- ID único da sala
winner_id         INTEGER                  -- ID do vencedor
created_at        TIMESTAMP                -- Quando começou
duration          INTEGER                  -- Duração em segundos
FOREIGN KEY(winner_id) → users(id)
```

#### 3. `match_players` - Participação em Partidas
```sql
id                SERIAL PRIMARY KEY
match_id          INTEGER NOT NULL         -- FK para matches
user_id           INTEGER NOT NULL         -- FK para users
position          INTEGER                  -- Colocação final (1º, 2º, etc)
score             INTEGER DEFAULT 0        -- Pontos da partida
kills             INTEGER DEFAULT 0        -- Quantidade de abates
deaths            INTEGER DEFAULT 0        -- Quantidade de mortes
survival_time     INTEGER DEFAULT 0        -- Tempo de sobrevivência (ms)
FOREIGN KEY(match_id) → matches(id) ON DELETE CASCADE
FOREIGN KEY(user_id) → users(id) ON DELETE CASCADE
```

#### 4. `player_stats` - Estatísticas Gerais
```sql
user_id           INTEGER PRIMARY KEY      -- FK para users
total_matches     INTEGER DEFAULT 0        -- Total de partidas
total_wins        INTEGER DEFAULT 0        -- Total de vitórias
total_kills       INTEGER DEFAULT 0        -- Total de abates
total_deaths      INTEGER DEFAULT 0        -- Total de mortes
win_rate          REAL DEFAULT 0           -- Taxa de vitória (%)
updated_at        TIMESTAMP                -- Última atualização
FOREIGN KEY(user_id) → users(id) ON DELETE CASCADE
```

**Funções Principais:**

```javascript
initDB()                                    // Inicializa todas as tabelas
testConnection()                            // Testa conexão com BD
createUser(username, email, passwordHash)  // Cria novo usuário
getUserByUsername(username)                // Busca usuário por nome
getUserIdByFirebaseUID(firebaseUID)        // Converte Firebase UID → user_id
getUserByFirebaseUID(firebaseUID)          // Busca usuário por Firebase UID
updateUserAvatar(userId, avatarUrl)        // Atualiza avatar do usuário
createMatch(matchId, winnerId)             // Registra uma partida
addPlayerToMatch(matchId, userId, ...)     // Adiciona player aos resultados
updatePlayerStats(userId, stats)           // Atualiza estatísticas
getPlayerStats(userId)                     // Obtém estatísticas do player
getLeaderboard(limit)                      // Retorna top players
```

**Tratamento de Erros:**
- Pool com timeout de 2 segundos
- Máximo 20 conexões simultâneas
- SSL obrigatório para Supabase
- Logs detalhados de conexões e erros

---

### 📄 **firebase.js** - Autenticação Firebase

**O que faz:**
- Inicializa Firebase Admin SDK no servidor
- Verifica e decodifica tokens Firebase
- Gerencia usuários no Firebase
- Cria custom tokens para autenticação

**Variáveis de Ambiente Necessárias:**
```
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=seu-email@seu-projeto-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

**Estratégias de Decodificação de Chave Privada:**

O arquivo decodifica a chave privada usando múltiplas estratégias:
1. Base64 → UTF-8 (se for codificada em base64)
2. Escape sequences: `\\n` → `\n`, `\\t` → `\t`, `\\r` → `\r`

Isso permite que a chave seja armazenada em variáveis de ambiente de formas diferentes.

**Funções Principais:**

```javascript
verifyToken(token)                          // Verifica e decodifica ID token
                                            // Retorna: { uid, email, iss, aud, ... }

getFirebaseUser(uid)                        // Obtém informações do usuário
                                            // Retorna: { uid, email, displayName, ... }

createFirebaseUser(email, password, displayName)
                                            // Cria novo usuário no Firebase
                                            // Retorna: { uid, email, ... }

deleteFirebaseUser(uid)                     // Deleta usuário do Firebase

createCustomToken(uid)                      // Cria custom token para cliente
                                            // Usado para autenticação sem senha
```

**Fluxo de Verificação de Token:**
```
1. Cliente envia Bearer token no header Authorization
2. Server chama firebase.verifyToken(token)
3. Firebase valida assinatura e expiração
4. Retorna objeto decodificado com uid
5. Se inválido/expirado, retorna null
```

---

### 📄 **auth.js** - Middleware de Autenticação

**O que faz:**
- Middleware Express para verificar token em rotas HTTP
- Middleware Socket.io para verificar token ao conectar
- Sincroniza usuários Firebase com banco PostgreSQL
- Gerencia dados de sessão do usuário

**Middleware Express:**

```javascript
authMiddleware(req, res, next)
// Verifica: Authorization: Bearer <token>
// Valida token via Firebase
// Converte Firebase UID → user_id do banco
// Adiciona ao request: req.userId, req.firebaseUID, req.userEmail
// Retorna 401 se inválido/ausente
```

**Middleware Socket.io:**

```javascript
socketAuthMiddleware(socket, next)
// Verifica: socket.handshake.auth.token
// Mesmo fluxo que Express
// Adiciona ao socket: socket.userId, socket.firebaseUID, socket.userEmail
// Rejeita conexão se inválido
```

**Sincronização com Banco:**

```javascript
syncUserToDatabase(firebaseUser)
// Se não existe: cria novo usuário no PostgreSQL
// Se existe: atualiza avatar se houver mudança
// Retorna user_id para uso interno
```

**Fluxo Completo:**
```
1. Cliente faz login com Firebase
2. Recebe ID token
3. Cliente envia requests com "Authorization: Bearer <idToken>"
4. Servidor verifica token via Firebase
5. Sincroniza/cria usuário no PostgreSQL
6. Autoriza a requisição com user_id do banco
```

---

### 📄 **supabase.js** - Armazenamento de Arquivos

**O que faz:**
- Gerencia upload/delete de imagens em Supabase Storage
- Gera URLs públicas para acesso aos arquivos

**Variáveis de Ambiente Necessárias:**
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=seu-chave-anonima
SUPABASE_STORAGE_BUCKET=battle-city-images
```

**Funções Principais:**

```javascript
uploadImage(file, bucket)
// Entrada: arquivo (buffer + mimetype + nome original)
// Saída: { success, fileName, publicUrl, path }
// Nomes: timestamp-aleatorio-original.ext

deleteImage(filePath, bucket)
// Entrada: caminho do arquivo no storage
// Saída: { success, error? }
```

**Exemplo de Uso:**
```javascript
const file = req.file; // Multipart form-data
const result = await uploadImage(file);
if (result.success) {
  console.log(result.publicUrl); // URL para usar no jogo
}
```

---

## 🎨 Frontend - Arquivos Public

### 📄 **index.html** - Estrutura Principal

**O que faz:**
- Define estrutura HTML da aplicação
- Carrega estilos CSS e fontes externas
- Define 5 telas principais da aplicação

**Telas Implementadas:**

#### 1. **screen-auth** - Autenticação
- Tabs para Login e Registro
- Campos: username, email (opcional), senha
- Validação de dados

#### 2. **screen-lobby** - Lobby de Salas
- Informações do usuário (username + botão logout)
- Logo central "BATTLE CITY"
- Botão "Criar Sala"
- Input para código de sala + Botão "Entrar"
- Painel de estatísticas do jogador

#### 3. **screen-game** - Jogo Ativo
- Canvas para renderização do jogo
- UI de jogo (vidas, score, powerups)
- Indicador de conexão

#### 4. **screen-overlay** - Overlay de Pausa/Erro
- Mostrar mensagens durante o jogo
- Pausar se desconectar

#### 5. **screen-scoreboard** - Placar Final
- Ranking final da partida
- Posições, pontos, kills/deaths
- Botão para voltar ao lobby

#### 6. **screen-leaderboard** - Placar Global
- Top players da aplicação
- Estatísticas gerais

**Fontes Carregadas:**
- **Press Start 2P**: Fonte retrô para UI
- **Share Tech Mono**: Fonte monospace para dados

**Scripts Carregados:**
```html
<!-- Após body fechar -->
<script src="/firebase-client.js"></script>  <!-- Carrega Firebase SDK -->
<script src="/auth.js"></script>              <!-- Autenticação -->
<script src="/game.js"></script>              <!-- Lógica do jogo -->
<script src="/scoreboard.js"></script>        <!-- Placar final -->
```

---

### 📄 **auth.js** (Cliente) - Autenticação Frontend

**O que faz:**
- Gerencia login/registro de usuários
- Integra com Firebase Authentication
- Converte custom tokens em ID tokens
- Gerencia tokens localmente

**Variáveis Globais:**
```javascript
currentToken        // ID token do Firebase (Bearer)
currentUserId       // ID do usuário no banco
currentUsername     // Nome do usuário
firebaseAuth        // Instância do Firebase Auth
```

**Funções Principais:**

```javascript
initFirebaseClient()
// Carrega SDK Firebase via CDN
// Inicializa com configuração do projeto
// Retorna quando pronto

convertCustomTokenToIdToken(customToken)
// Recebe custom token do servidor
// Faz login anônimo com token customizado
// Obtém ID token válido
// Retorna ID token para uso em requisições

showAuthScreen(name)
// Alterna entre telas: 'auth', 'lobby', 'game', etc
// Usa display: flex/none

// Função de Login
async handleLogin(username, password)
// Envia credenciais para /api/login
// Recebe custom token
// Converte para ID token
// Armazena em localStorage
// Mostra lobby

// Função de Registro
async handleRegister(username, email, password)
// Envia dados para /api/register
// Cria usuário no Firebase + PostgreSQL
// Faz login automático
// Armazena token
```

**Fluxo de Autenticação:**
```
1. Usuário preenche login/registro
2. Envia para servidor
3. Servidor autentica com Firebase
4. Servidor cria custom token
5. Cliente recebe custom token
6. Cliente faz sign-in com custom token
7. Firebase retorna ID token
8. Cliente usa ID token em todas requisições
```

**Integração com Firebase:**
- Importação dinâmica do Firebase SDK via ES6 modules
- Não requer arquivo de configuração local (hardcoded no código)
- Usa custom tokens para autenticação segura

---

### 📄 **game.js** (Cliente) - Lógica e Renderização

**O que faz:**
- Cria conexão Socket.io com servidor
- Renderiza jogo no canvas HTML5
- Captura input do usuário
- Sincroniza estado com servidor via interpolação

**Constantes de Jogo:**
```javascript
TILE = 32          // Tamanho do tile
TANK_SIZE = 28     // Tamanho do tanque
MAP_COLS = 26
MAP_ROWS = 26
```

**Variáveis de Estado:**
```javascript
socket              // Conexão Socket.io
snapA, snapB        // Snapshots de estado para interpolação
map                 // Mapa atual [row][col] = 0/1/2
players             // Lista de tanks ativos
bullets             // Lista de projéteis
myId                // ID do meu tanque
myMatchData         // Dados da minha partida (kills, deaths, score)
gameRunning         // Boolean se jogo está rodando
currentRoomId       // ID da sala atual
```

**Funções Principais:**

```javascript
initSocket()
// Cria conexão Socket.io com token
// Setup de event listeners
// Transporte: WebSocket apenas

setupSocketListeners()
// 'state': recebe snapshot do servidor
// 'tileDestroyed': atualiza mapa localmente
// 'roundOver': mostra scoreboard
// 'roundReset': reseta mapa e dados
// 'connect/disconnect': gerencia conexão

// Renderização
function render()
// Renderiza a cada frame:
// 1. Limpa canvas
// 2. Desenha mapa (tijolos + aço)
// 3. Interpola posições dos tanks (smooth entre snapshots)
// 4. Desenha projéteis
// 5. Desenha UI (score, vida, minimap)

// Interpolação de Estado
// Recebe snapshots A e B com timestamp
// Calcula progresso entre A e B
// Desenha tanks em posição interpolada
// Resultado: movimento suave mesmo com lag
```

**Input do Usuário:**
```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') socket.emit('move', { dir: 'up' });
  if (e.key === 'ArrowDown') socket.emit('move', { dir: 'down' });
  if (e.key === 'ArrowLeft') socket.emit('move', { dir: 'left' });
  if (e.key === 'ArrowRight') socket.emit('move', { dir: 'right' });
  if (e.key === ' ') socket.emit('shoot');
});
```

**Renderização de Elementos:**

1. **Mapa**: Desenha tijolos amarelos (1) e aço cinza (2)
2. **Tanks**: Círculos coloridos com número do player
3. **Projéteis**: Pequenos retângulos em movimento
4. **Power-ups**: Ícones especiais (escudo, balas extras)
5. **UI**: Texto com score, kills, deaths, vidas

**Otimizações:**
- Interpolação: smooth movement sem spam de updates
- Request animation frame: 60 FPS
- Canvas double buffering (implícito)
- Apenas redraw diferenças quando possível

---

### 📄 **scoreboard.js** - Placar Final

**O que faz:**
- Mostra ranking final após fim de partida
- Salva estatísticas da partida no servidor
- Gerencia transição para lobby

**Estrutura do Ranking:**
```javascript
matchData = {
  winnerId: playerId,
  players: [
    {
      id, username, score, kills, deaths, position
    },
    // ...
  ]
}
```

**Função Principal:**

```javascript
async showScoreboard(matchData)
// 1. Ordena players por posição
// 2. Gera HTML com ranking:
//    - Medalhas (🥇🥈🥉)
//    - Nome do jogador
//    - Pontos
//    - Kills/Deaths
//    - Badge de vencedor 👑
// 3. Insere HTML na página
// 4. Mostra tela de scoreboard
// 5. Envia POST para /api/match-end com dados da partida
// 6. Salva stats no servidor
```

**Dados Enviados:**
```javascript
{
  matchId: currentRoomId,
  matchData: {
    kills: number,
    deaths: number,
    score: number,
    position: number,
    survived: boolean,
    won: boolean,
    survivalTime: timestamp
  }
}
```

**Botão de Retorno:**
- Click em "Voltar ao Lobby"
- Desconecta Socket.io
- Recarrega página para nova sessão

---

### 📄 **style.css** - Estilos e Temas

**O que faz:**
- Define tema visual retrô do jogo
- Responsividade para mobile
- Animações e efeitos visuais

**Paleta de Cores (CSS Variables):**
```css
--yellow:   #f7c948   /* Cor primária - texto/botões */
--red:      #e74c3c   /* Vermelho para erros */
--teal:     #4ecdc4   /* Segundo destaque */
--dark:     #0d1117   /* Fundo escuro */
--darker:   #080c10   /* Fundo ainda mais escuro */
--surface:  #161c24   /* Cards/surfícies */
--border:   rgba(...) /* Bordas com alpha */
--text:     #e2e8f0   /* Texto principal */
--muted:    #6e7f8d   /* Texto secundário */
```

**Fontes:**
- **Press Start 2P**: Títulos e UI retrô
- **Share Tech Mono**: Dados e valores numéricos

**Componentes Principais:**

1. **Screens**: Posição fixed, flex centering
2. **Lobby BG**: Grid pattern com repeating linear gradient
3. **Cards**: Containers com borda/sombra
4. **Botões**: 
   - `.btn-primary`: Amarelo com sombra
   - `.btn-secondary`: Outline azul
5. **Logo**: Glow effect com text-shadow
6. **Animações**:
   - `tank-bob`: Tanques flutuando
   - `blink`: Piscada de texto
7. **Responsividade**: `clamp()` para font-size adaptável

**Layouts:**

- **Auth Screen**: Cards centralizadas
- **Lobby**: Logo + Botões em coluna
- **Game**: Canvas full screen
- **Scoreboard**: Ranking list com styling

**Temas de Cores:**
- Fundo preto/cinza escuro
- Texto amarelo/teal
- Borders com baixa opacidade para efeito sutil
- Efeito glow em títulos

---

## ⚙️ Arquivos de Configuração

### 📄 **package.json**
- Define metadados do projeto
- Lista dependências e versões
- Scripts de npm (start, dev, build)
- Node.js >= 18 requerido

### 📄 **app.json**
- Configuração para Heroku/Back4App
- Define variáveis de ambiente obrigatórias
- Build packs (Node.js)
- Success URL após deploy
- Descrição e keywords para descoberta

### 📄 **Dockerfile**
- Build multi-stage (builder + runtime)
- Base: `node:20-alpine` (leve e seguro)
- User não-root (appuser)
- Health check incluído
- Expõe porta 8080
- CMD: `node server.js`

### 📄 **.env** (não versionado)
Template necessário:
```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_STORAGE_BUCKET=battle-city-images
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### 📄 **Procfile**
Define comando para iniciar em Heroku:
```
web: node server.js
```

### 📄 **render.yaml**
Configuração alternativa para Render hosting

### 📄 **VERCEL_SETUP.md**, **RENDER_SETUP.md**, **FIREBASE_SETUP.md**
Guias de configuração para diferentes plataformas

---

## 🔄 Fluxo de Funcionamento

### Inicialização da Aplicação:

```
1. npm start
   ↓
2. Carrega .env
   ↓
3. Inicializa Firebase Admin SDK
   ↓
4. Testa conexão PostgreSQL
   ↓
5. Cria/valida tabelas do BD
   ↓
6. Inicia Express server na porta 8080
   ↓
7. Inicializa Socket.io
   ↓
8. Pronto para aceitar conexões
```

### Fluxo de Usuário:

```
1. Usuário acessa http://localhost:8080
   ↓
2. Carrega index.html + arquivos estáticos (public/)
   ↓
3. Executa auth.js (carrega Firebase SDK)
   ↓
4. Mostra tela de login
   ↓
5. Usuário preenche formulário
   ↓
6. POST /api/register ou /api/login
   ↓
7. Servidor valida e cria custom token
   ↓
8. Cliente converte custom token em ID token
   ↓
9. Armazena token em localStorage
   ↓
10. Mostra lobby de salas
```

### Fluxo de Jogo:

```
1. Usuário clica "Criar Sala" ou "Entrar"
   ↓
2. Socket.io conecta com token
   ↓
3. Socket middleware valida token
   ↓
4. Servidor adiciona player à sala
   ↓
5. Servidor inicia game loop se primeira pessoa
   ↓
6. A cada 30ms:
   a) Processa input dos players
   b) Atualiza física (movimento, colisões)
   c) Detecta destruição de tiles
   d) Spawna power-ups
   e) Emite 'state' para todos os clientes
   f) Verifica condição de vitória
   ↓
7. Clientes recebem 'state'
   ↓
8. Clientes interpõem entre estados
   ↓
9. Clientes renderizam na frame atual (60 FPS)
   ↓
10. Quando player morre:
    a) Aguarda 3 segundos
    b) Respawn com novo tanque
    ↓
11. Quando últimos 1 player vivo:
    a) Emite 'roundOver' com ranking
    b) Mostra scoreboard no cliente
    c) POST /api/match-end para salvar stats
    d) Aguarda comando do usuário
    ↓
12. Clique "Voltar ao Lobby"
    a) Desconecta socket
    b) Volta para screen-lobby
```

### Fluxo de Sincronização em Tempo Real:

```
Cliente A                Servidor               Cliente B
     ↓                        ↓                      ↓
Input:                  
 Move Up ───────────────→ Processa:
                        - Colisão
                        - Nova posição
                        - Estado do mapa
                        
                        Emite 'state' ────────→ Recebe state
                                               Armazena como snapB
                                               Interpõe posição
                                               Renderiza
                                               
Renderiza               
com interpolação        
```

---

## 📊 Estrutura de Dados

### Estado do Jogo (Servidor):

```javascript
gameState = {
  map: [[0,1,2,...], [...], ...],    // 26x26 matriz de tiles
  players: {
    "playerId": {
      id: "ABC123",
      x: 32,
      y: 32,
      dir: "down",                   // Direção virada
      vel: { x: 0, y: 0 },           // Velocidade
      color: "#f7c948",
      username: "Player1",
      tank_level: 1,                 // 1-3
      alive: true,
      score: 150,
      kills: 2,
      deaths: 1,
    },
    // ... até 6 players
  },
  bullets: [
    {
      x: 64,
      y: 64,
      vx: 16,
      vy: 0,
      owner: "playerId",
    },
    // ...
  ],
  powerups: [
    {
      x: 192,
      y: 192,
      type: "shield" | "extra_bullets" | "speed",
      active: true,
    },
    // ...
  ]
}
```

### Snapshot de Estado (Socket):

```javascript
{
  time: 1704067200000,  // Timestamp do servidor
  state: {
    map: [...],
    players: [...],
    bullets: [...]
    // Omite powerups para economizar banda
  }
}
```

### Dados de Partida (BD):

```javascript
match = {
  id: 1,
  match_id: "XYZK",
  winner_id: 5,
  created_at: "2024-01-01T12:00:00Z",
  duration: 1825,  // segundos
}

match_player = {
  id: 42,
  match_id: 1,
  user_id: 5,
  position: 1,      // Colocação
  score: 450,
  kills: 8,
  deaths: 2,
  survival_time: 1825000,  // ms
}

player_stats = {
  user_id: 5,
  total_matches: 47,
  total_wins: 12,
  total_kills: 289,
  total_deaths: 156,
  win_rate: 25.5,  // percentual
  updated_at: "2024-01-15T10:30:00Z",
}
```

---

## 🎯 Fluxo Detalhado de Uma Partida

### Fase 1: Criação da Sala

```
Cliente A clicks "Criar Sala"
    ↓
Socket emit: 'join-room' { action: 'create' }
    ↓
Servidor gera room_id (4 letras aleatórias)
    ↓
Servidor inicializa:
  - Novo mapa
  - Lista vazia de players
  - Game loop a 30 ticks/segundo
    ↓
Servidor retorna room_id via socket
    ↓
Cliente A mostra: "Código da Sala: XYZK"
    ↓
Servidor envia 'state' vazio (apenas mapa)
```

### Fase 2: Entrada de Mais Players

```
Cliente B vê código XYZK
Cliente B clica "Entrar" + digita "XYZK"
    ↓
Socket emit: 'join-room' { action: 'join', roomCode: 'XYZK' }
    ↓
Servidor valida código
    ↓
Servidor atualiza players list (agora 2 players)
    ↓
Servidor broadcast novo state para todos na sala
    ↓
Cliente A recebe novo state com Player B
    ↓
Cliente B recebe estado e começa a renderizar
```

### Fase 3: Loop de Jogo

```
Server tick (30 vezes por segundo):
  1. Processa input acumulado:
     - move up/down/left/right
     - shoot
  
  2. Atualiza posições:
     - Verifica colisão com mapa
     - Verifica colisão com outros tanks
     - Aplica velocidade
  
  3. Atualiza projéteis:
     - Move cada bala
     - Detecta colisão com tijolos → destroi tile
     - Detecta colisão com tanks → damage/morte
     - Remove balas fora da tela
  
  4. Atualiza power-ups:
     - Detecta colisão com players
     - Aplica efeito (shield, double bullets, speed)
  
  5. Respawn de players mortos:
     - Se tempo >= RESPAWN_DELAY
     - Cria novo tanque no spawn
     - Reseta velocidade e direção
  
  6. Broadcast state:
     - Emite snapshot com timestamp
     - Envia para todos os clientes
```

### Fase 4: Renderização no Cliente

```
60 FPS Animation Loop:
  1. Calcula tempo decorrido
  
  2. Interpola entre snapshots:
     progress = (currentTime - snapA.time) / (snapB.time - snapA.time)
     posição = snapA.pos + (snapB.pos - snapA.pos) * progress
  
  3. Limpa canvas
  
  4. Desenha:
     - Mapa (tiles)
     - Tanks (com interpolação)
     - Projéteis
     - Power-ups
     - UI (score, kills, deaths)
```

### Fase 5: Condição de Vitória

```
Quando 1 player vivo:
  ↓
  Servidor emit 'roundOver' com:
    - winnerId
    - Ranking final com pontos
    - Kills/deaths de cada player
  ↓
  Clientes mostram scoreboard
  ↓
  Cada cliente POST /api/match-end
  ↓
  Servidor salva em BD:
    - Nova linha em `matches`
    - Entrada em `match_players` para cada participant
    - Atualiza `player_stats`
```

### Fase 6: Reset e Nova Partida

```
Usuário click "Voltar ao Lobby"
  ↓
  Socket.io desconecta
  ↓
  Volta para screen-lobby
  ↓
  Pode criar nova sala ou entrar em outra
```

---

## 🚀 Resumo Executivo

**Battle City Multiplayer** é um jogo competitivo multiplayer que:

✅ **Funcionalidades:**
- Autenticação Firebase segura
- Até 6 jogadores simultâneos
- Sincronização em tempo real via Socket.io
- Persistência de dados em PostgreSQL
- Sistema de ranking e estatísticas
- Responsivo e retrô visualmente

✅ **Tecnologias:**
- Backend: Node.js + Express + Socket.io
- Frontend: HTML5 Canvas + Vanilla JS
- BD: PostgreSQL (Supabase) + Supabase Storage
- Auth: Firebase Admin + Firebase Client

✅ **Deployment:**
- Docker-ready
- Heroku/Back4App compatible
- Render ready
- Vercel ready

✅ **Performance:**
- 30 ticks/segundo servidor
- 60 FPS cliente
- Interpolação suave
- Conexão persistente WebSocket

---

## 📝 Notas Importantes

1. **Variáveis de Ambiente**: TODAS as variáveis em `.env` são obrigatórias para funcionamento
2. **Credenciais Firebase**: A chave privada pode estar em base64 ou com escape sequences
3. **PostgreSQL**: Requer SSL conectado (Supabase padrão)
4. **Limit de Sala**: Máximo 6 players por room
5. **Respawn**: Aguarda 3 segundos antes de aparecer novo tanque
6. **Autorização**: Todos os endpoints HTTP e sockets requerem token válido
7. **Banco de Dados**: Criado automaticamente na primeira execução
8. **Health Check**: Endpoint `/health` disponível sem autenticação

---

**Documento atualizado: 2024 | Battle City Multiplayer v1.0.0**
