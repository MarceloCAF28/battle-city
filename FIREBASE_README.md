# ✅ Integração Firebase + Supabase Concluída

Seu projeto **Battle City** agora está 100% integrado com:
- ✅ **Firebase Authentication** (gerenciamento de usuários)
- ✅ **Supabase PostgreSQL** (banco de dados)
- ✅ **Supabase Storage** (armazenamento de imagens)

## 📋 O que foi criado

### Arquivos Novos
```
firebase.js                      ← Firebase Admin SDK (backend)
public/firebase-client.js        ← Firebase Web SDK (frontend)
auth-routes.example.js           ← Exemplo de rotas autenticadas
FIREBASE_SETUP.md                ← Guia completo Firebase
FIREBASE_INTEGRATION.md          ← Resumo das mudanças
```

### Arquivos Modificados
```
auth.js                          ← Reescrito para Firebase
db.js                           ← Adicionado suporte Firebase UID
package.json                     ← Adicionado firebase-admin e firebase
.env                            ← Adicionadas credenciais Firebase
.env.example                    ← Atualizado com template Firebase
```

## 🔐 Credenciais Necessárias

### Firebase Console (Obtenha aqui)
```bash
# 1. Acesse: https://console.firebase.google.com/
# 2. Projeto: battle-city-bd36e
# 3. ⚙️ Project Settings → Service Accounts
# 4. Gere uma chave privada
# 5. Copie para .env:

FIREBASE_PROJECT_ID=battle-city-bd36e
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@battle-city-bd36e.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Supabase (Configure com suas credenciais)
```env
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-1-us-west-2.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## 🚀 Próximos Passos

### 1️⃣ Obter Credenciais Firebase Admin
```bash
# Visite: https://console.firebase.google.com/
# → battle-city-bd36e
# → Configurações do Projeto
# → Contas de Serviço
# → Gerar Nova Chave Privada
# → Copie os dados para .env
```

### 2️⃣ Preencher `.env`
```bash
# Edite o arquivo .env na raiz do projeto
# Preencha:
# - FIREBASE_PROJECT_ID
# - FIREBASE_CLIENT_EMAIL  
# - FIREBASE_PRIVATE_KEY
```

### 3️⃣ Instalar Dependências
```bash
npm install
```

### 4️⃣ Criar Bucket Supabase
```bash
# No painel Supabase:
# Storage → Create bucket
# Nome: battle-city-images
# Tipo: Public
```

### 5️⃣ Testar
```bash
npm start
# Deve conectar sem erros!
```

## 💻 Uso no Frontend

```javascript
// Importar funções Firebase
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentToken 
} from './firebase-client.js';

// Registrar novo usuário
const user = await registerUser('user@example.com', 'password123');
console.log('UID:', user.uid);
console.log('Token:', user.token);

// Login
const user = await loginUser('user@example.com', 'password123');
localStorage.setItem('firebaseToken', user.token);

// Usar em requisições
const token = localStorage.getItem('firebaseToken');
fetch('/api/auth/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Logout
await logoutUser();
```

## 🎮 Uso no Socket.io

```javascript
const token = localStorage.getItem('firebaseToken');

const socket = io({
  auth: { token }
});

socket.on('connect', () => {
  console.log('✓ Conectado ao servidor');
  // socket.userId está disponível no backend
});
```

## 🔄 Fluxo Completo

```
[Frontend - firebase-client.js]
        ↓ (registerUser / loginUser)
[Firebase Authentication]
        ↓ (token ID)
[Frontend stores token]
        ↓ (socket.io / fetch)
[Backend - auth.js middleware]
        ↓ (verifyToken)
[Firebase Admin SDK validates]
        ↓ (decodedToken)
[syncUserToDatabase]
        ↓
[Supabase PostgreSQL]
        ↓
[User now logged in & synced]
```

## 📦 Dependências Instaladas

**Removidas** (JWT local):
- `jsonwebtoken`
- `bcryptjs`

**Adicionadas** (Firebase):
- `firebase-admin` (v12.0.0)
- `firebase` (v10.8.0)

**Mantidas**:
- `express`, `socket.io`, `pg`, `@supabase/supabase-js`, `cors`, `dotenv`

## 📊 Banco de Dados

### Coluna Adicionada
```sql
ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE;
```

Isso vincula usuários Firebase ao banco Supabase.

### Novas Funções DB
```javascript
// Criar usuário a partir de Firebase
createUserFromFirebase(firebaseUID, email, displayName, photoURL)

// Buscar usuário por Firebase UID
getUserByFirebaseUID(firebaseUID)
```

## 🧪 Testar Autenticação

```bash
# 1. Iniciar servidor
npm start

# 2. No frontend, chamar:
import { registerUser } from './public/firebase-client.js';

const user = await registerUser('test@example.com', 'password123');
console.log('Usuario criado:', user);

# 3. Verificar se foi sincronizado com Supabase:
# SELECT * FROM users WHERE firebase_uid = 'xxxxx';
```

## 🆘 Dúvidas?

| Erro | Solução |
|------|---------|
| "FIREBASE_PROJECT_ID not found" | Preencer .env com credenciais |
| "Invalid private key" | Copiar private_key exatamente do Firebase Console |
| "Token inválido" | Verifique se frontend obtém token após login |
| "Usuário não sincroniza" | Middleware authMiddleware precisa estar ativo |

## 📚 Documentação Completa

- **FIREBASE_SETUP.md** - Guia passo-a-passo
- **FIREBASE_INTEGRATION.md** - Resumo técnico
- **firebase-client.js** - Exemplo frontend
- **auth-routes.example.js** - Exemplo rotas backend

## ✨ Benefícios

✅ Segurança: Gerenciado pelo Google
✅ 2FA: Suportado nativamente
✅ Social Login: Fácil adicionar
✅ Escalável: Sem overhead local
✅ Integrado: Firebase + Supabase perfeitos juntos

---

**🎉 Seu projeto está pronto!**

1. Configure credenciais Firebase
2. Execute `npm install && npm start`
3. Use funções no frontend
4. Aproveite a autenticação!

Para suporte: Veja [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
