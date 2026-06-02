# Resumo: Integração Firebase + Supabase

## ✅ O que foi implementado

### 1. Autenticação Migrada
- **De**: JWT + bcrypt local
- **Para**: Firebase Authentication (gerenciado pelo Google)

### 2. Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `firebase.js` | Configuração Firebase Admin SDK (backend) |
| `public/firebase-client.js` | Firebase Web SDK para frontend |
| `auth-routes.example.js` | Exemplo de rotas com Firebase |
| `FIREBASE_SETUP.md` | Guia completo de setup |

### 3. Arquivos Modificados
| Arquivo | Mudanças |
|---------|----------|
| `auth.js` | Reescrito para usar Firebase tokens |
| `db.js` | Adicionados campos e funções Firebase |
| `package.json` | Substituído `jsonwebtoken` e `bcryptjs` por `firebase-admin` e `firebase` |
| `.env` | Adicionadas credenciais Firebase |

### 4. Nova Coluna no BD
```sql
ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE;
```

Isso permite vincular usuários Firebase ao banco Supabase.

## 🔄 Mudanças de Código

### Antes (JWT)
```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function hashPassword(password) {
  return bcrypt.hash(password, salt);
}
```

### Depois (Firebase)
```javascript
const { verifyToken } = require('./firebase');

async function verifyToken(token) {
  return await auth.verifyIdToken(token);
}

// Senha é gerenciada pelo Firebase (não local)
```

## 🎯 Novo Fluxo

### 1. Registro (Frontend)
```javascript
import { registerUser } from './firebase-client.js';

const user = await registerUser('user@example.com', 'password');
// Retorna: { uid, email, token, displayName, photoURL }
```

### 2. Login (Frontend)
```javascript
import { loginUser } from './firebase-client.js';

const user = await loginUser('user@example.com', 'password');
// Retorna: { uid, email, token, displayName, photoURL }
```

### 3. Usar Token em Requisições
```javascript
const token = user.token;

fetch('/api/auth/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 4. Backend Valida e Sincroniza
```javascript
// Middleware authMiddleware:
const decodedToken = await verifyToken(token);
await syncUserToDatabase(decodedToken);
// ↓ Usuário sincronizado com Supabase
```

## 📊 Banco de Dados

### Tabela users (atualizada)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firebase_uid TEXT UNIQUE,          -- ← NOVO (vincula com Firebase)
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,                -- ← Agora NULL (Firebase cuida)
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Novas Funções DB
```javascript
// Criar usuário a partir de Firebase
createUserFromFirebase(uid, email, displayName, photoURL)

// Buscar usuário por Firebase UID
getUserByFirebaseUID(uid)
```

## 🔑 Variáveis de Ambiente

### Removidas
- `JWT_SECRET` (não mais necessário)

### Adicionadas
```
FIREBASE_PROJECT_ID=battle-city-bd36e
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

### Mantidas
```
DATABASE_URL=... (Supabase)
SUPABASE_URL=... (Supabase)
SUPABASE_ANON_KEY=... (Supabase)
SUPABASE_SERVICE_ROLE_KEY=... (Supabase)
```

## 🚀 Benefícios

✅ **Segurança**: Senhas gerenciadas pelo Google
✅ **Escalabilidade**: Sem overhead de JWT/bcrypt local
✅ **Integração**: Firebase oferece 2FA, Social login, etc
✅ **Sincronização**: Usuário Firebase → Supabase automática
✅ **Token Refresh**: Automático no frontend

## ⚠️ O que Mudou para o Frontend

### Antes
```javascript
// Login retornava JWT local
const { token } = await fetch('/auth/login', ...)
localStorage.setItem('token', token);
```

### Depois
```javascript
// Login usa Firebase
import { loginUser } from './firebase-client.js';

const user = await loginUser(email, password);
localStorage.setItem('firebaseToken', user.token);
// Token é válido por 1 hora (renovado automaticamente)
```

## 📝 Checklist de Implementação

- [ ] Obter credenciais Firebase Admin SDK
- [ ] Preencher `.env` com credenciais Firebase
- [ ] Instalar dependências: `npm install`
- [ ] Criar Storage Bucket `battle-city-images` (Supabase)
- [ ] Testar login: `npm start`
- [ ] Importar `firebase-client.js` no frontend
- [ ] Usar `loginUser()` no game.js
- [ ] Testar Socket.io com token Firebase
- [ ] Configurar RLS no Supabase (produção)

## 🔗 Recursos

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Example Auth Routes](./auth-routes.example.js)
- [Firebase Client Code](./public/firebase-client.js)

---

**Status**: ✅ Integração Completa - Pronto para Configurar
