# Firebase + Supabase - Guia de Integração

Seu projeto agora usa **Firebase Authentication** + **Supabase Database & Storage**.

## 🏗️ Arquitetura

```
Frontend (HTML/JS)
    ↓ (firebase-client.js)
Firebase Authentication
    ↓ (token)
Backend (Node.js/Express)
    ↓ (verify token)
Supabase PostgreSQL Database
Supabase Storage (imagens)
```

## 🔐 Autenticação

### Backend (Node.js)
- **Firebase Admin SDK**: Verificação de tokens
- Local: `firebase.js`
- Variáveis: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### Frontend (Browser)
- **Firebase Web SDK**: Login/Registro
- Local: `public/firebase-client.js`
- Sem credenciais secretas (usa API public key)

## 📊 Banco de Dados

- **Supabase PostgreSQL**: Armazena dados de usuários, partidas, estatísticas
- Tabelas: users, matches, match_players, player_stats
- Campo novo: `firebase_uid` (vincula usuário Firebase ao banco)

## 📦 Instalação

### 1. Obter Credenciais Firebase

#### Para o Backend (Admin SDK):
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Projeto: `battle-city-bd36e`
3. ⚙️ Project Settings → Service Accounts
4. Clique "Generate New Private Key"
5. Copie os dados:
   - `project_id`
   - `client_email`
   - `private_key` (inclui quebras de linha)

#### Para o Frontend:
- Já configurado em `public/firebase-client.js`
- Valores salvos em `.env` (não exponha no código)
  ```
  FIREBASE_WEB_API_KEY=YOUR_WEB_API_KEY_FROM_FIREBASE_CONSOLE
  FIREBASE_AUTH_DOMAIN=battle-city-bd36e.firebaseapp.com
  FIREBASE_PROJECT_ID=battle-city-bd36e
  ```

### 2. Configurar `.env`

```bash
# Credenciais Firebase Admin (do Firebase Console → Project Settings → Service Accounts)
FIREBASE_PROJECT_ID=battle-city-bd36e
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@battle-city-bd36e.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase (do Supabase Console → Project Settings → API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-1-us-west-2.pooler.supabase.com:6543/postgres
```

**⚠️ NUNCA exponha essas chaves no código ou GitHub! Use `.env` local apenas.**

### 3. Instalar Dependências

```bash
npm install
```

Será instalado:
- `firebase-admin` - Autenticação no backend
- `firebase` - Cliente frontend (opcional, já pode estar)
- `pg` - PostgreSQL
- `@supabase/supabase-js` - Supabase

### 4. Iniciar Servidor

```bash
npm start
```

## 🚀 Fluxo de Autenticação

### 1. Usuário faz Login (Frontend)

```javascript
// Em public/game.js ou index.html
import { loginUser, getCurrentToken } from './firebase-client.js';

// Login
const user = await loginUser('user@example.com', 'password123');
console.log('Token Firebase:', user.token);

// Armazenar token
localStorage.setItem('firebaseToken', user.token);
```

### 2. Conectar ao Socket.io (com token)

```javascript
const token = localStorage.getItem('firebaseToken');

const socket = io({
  auth: { token }
});

socket.on('connect', () => {
  console.log('✓ Conectado ao servidor');
  // socket.userId estará disponível no backend
});
```

### 3. Chamar APIs Autenticadas (Backend)

```javascript
const token = localStorage.getItem('firebaseToken');

// Obter perfil
const response = await fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Perfil:', data.user);
```

### 4. Backend Valida Token

```javascript
// Em auth.js - middleware authMiddleware
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  // Verifica com Firebase Admin SDK
  const decodedToken = await verifyToken(token);
  
  if (!decodedToken) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  // Sincroniza usuário com Supabase
  await syncUserToDatabase(decodedToken);
  
  next();
}
```

## 📝 Funções Disponíveis

### Frontend (firebase-client.js)

```javascript
import { 
  registerUser,        // (email, password) → User
  loginUser,           // (email, password) → User
  logoutUser,          // () → void
  getCurrentToken,     // () → token string
  onAuthChange,        // (callback) → unsubscribe
  getCurrentUser       // () → Firebase User
} from './firebase-client.js';
```

### Backend (firebase.js)

```javascript
const { 
  verifyToken,           // (token) → decodedToken
  getFirebaseUser,       // (uid) → User
  createFirebaseUser,    // (email, password, name) → User
  deleteFirebaseUser,    // (uid) → boolean
  updateFirebaseUser     // (uid, updates) → User
} = require('./firebase');
```

### Database (db.js)

```javascript
// Novo para Firebase:
createUserFromFirebase(uid, email, name, photoURL)
getUserByFirebaseUID(uid)

// Existente:
getUserById(id)
getPlayerStats(userId)
updatePlayerStats(userId, data)
```

## 🔄 Fluxo Completo de Registro

```javascript
// 1. FRONTEND: Usuário registra
import { registerUser } from './firebase-client.js';

const user = await registerUser('novo@email.com', 'senha123');
console.log('Firebase UID:', user.uid);
console.log('Token:', user.token);

// 2. FRONTEND: Armazenar token
localStorage.setItem('firebaseToken', user.token);

// 3. FRONTEND: Conectar Socket.io
const socket = io({ auth: { token: user.token } });

// 4. BACKEND: Middleware valida e sincroniza
// → Cria usuário em Supabase com firebase_uid

// 5. PRONTO: Usuário pode jogar!
```

## 🔒 Segurança

✅ Token Firebase expires em 1 hora (renovado automaticamente no frontend)
✅ Private key do Firebase não fica no frontend
✅ Supabase credenciais protegidas no .env
✅ RLS (Row Level Security) pode ser configurado no Supabase
✅ Senha nunca é armazenada no Supabase (Firebase cuida disso)

## 🐛 Troubleshooting

### Erro: "FIREBASE_PROJECT_ID not found"
```
→ Verifique .env
→ FIREBASE_PROJECT_ID deve ser: battle-city-bd36e
```

### Erro: "Invalid private key"
```
→ Verifique se private_key tem \n corretos
→ Copie do Firebase Console sem alterar
```

### Erro: "Token inválido"
```
→ Frontend: Verifique se token foi obtido após login
→ Backend: Verifique credenciais Firebase Admin
```

### Usuário não sincroniza com banco
```
→ Verificar se middleware authMiddleware está sendo usado
→ Verificar se firebase_uid está sendo setado
```

## 📚 Arquivos Principais

| Arquivo | Propósito |
|---------|----------|
| `firebase.js` | Configuração Firebase Admin (backend) |
| `public/firebase-client.js` | SDK Firebase (frontend) |
| `auth.js` | Middleware de autenticação |
| `db.js` | Operações Firebase → Supabase |
| `.env` | Credenciais (protegido) |

## 🔗 Próximos Passos

1. **Obter credenciais Firebase Admin**
2. **Preencher .env com credenciais**
3. **Instalar dependências**: `npm install`
4. **Importar firebase-client.js no frontend**
5. **Usar funcionalidades no game.js**

## 📖 Documentação Oficial

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Supabase Database](https://supabase.com/docs/guides/database)

---

**Status**: ✅ Integração Pronta - Aguardando Credenciais Firebase Admin
