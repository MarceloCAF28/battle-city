# Resumo das Mudanças - Migração para Supabase

## 📋 O que foi feito

### 1. ✅ Banco de Dados Migrado
- **De:** SQLite local (`battle-city.db`)
- **Para:** PostgreSQL Supabase (pooler.supabase.com:6543)
- **Camada:** Mudança no `db.js` usando biblioteca `pg`

### 2. ✅ Novas Dependências Instaladas
```json
{
  "pg": "^8.11.3",
  "@supabase/supabase-js": "^2.38.0",
  "dotenv": "^16.3.1"
}
```

### 3. ✅ Novos Arquivos Criados
- `supabase.js` - Configuração e funções Supabase (Storage + API)
- `.env` - Arquivo de configuração (protegido no .gitignore)
- `.env.example` - Template com instruções
- `SUPABASE_SETUP.md` - Guia completo de configuração
- `SUPABASE_QUICK_START.md` - Início rápido
- `image-routes.example.js` - Exemplo de rotas para upload

### 4. ✅ Tabelas PostgreSQL Criadas
| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários com avatar_url novo |
| `matches` | Partidas do jogo |
| `match_players` | Participação em partidas |
| `player_stats` | Estatísticas gerais dos jogadores |

### 5. ✅ Recursos de Storage
- Bucket: `battle-city-images` (público)
- Upload/Delete de arquivos
- URLs públicas automáticas
- Validação de tipo (apenas imagens)
- Limite: 5MB por arquivo

## 🔄 Mudanças Técnicas

### Sintaxe SQL
```javascript
// Antigo (SQLite)
'INSERT INTO users VALUES (?, ?, ?)'

// Novo (PostgreSQL)
'INSERT INTO users VALUES ($1, $2, $3) RETURNING id'
```

### Tipos de Dados
| SQLite | PostgreSQL |
|--------|-----------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` |
| `DATETIME` | `TIMESTAMP` |
| `REAL` | `REAL` |

### Nova Função
```javascript
// Atualizar avatar do usuário
await db.updateUserAvatar(userId, avatarUrl);
```

## 🔐 Segurança Implementada

✅ Arquivo `.env` protegido no `.gitignore`
✅ Suporte SSL para conexão PostgreSQL
✅ Pool de conexões otimizado
✅ Parâmetros preparados (proteção contra SQL injection)
✅ Validação de tipos de arquivo

## 📊 Performance

✅ Índices criados:
- `idx_matches_created_at` - Queries rápidas de histórico
- `idx_match_players_user` - Busca de partidas por usuário
- `idx_player_stats_wins` - Ranking e leaderboard

✅ Pool de conexões:
- Max 20 conexões
- Idle timeout: 30s
- Connection timeout: 2s

## 📝 Alteração de API (db.js)

### Funções que continuam iguais
```javascript
createUser(username, email, passwordHash, avatarUrl)
getUserByUsername(username)
getUserById(id)
createMatch(matchId, duration)
addPlayerToMatch(matchId, userId, position, score, kills, deaths, survivalTime)
setMatchWinner(matchId, winnerId)
getMatchHistory(userId, limit)
getPlayerStats(userId)
updatePlayerStats(userId, matchData)
getGlobalLeaderboard(limit)
```

### Nova Função
```javascript
updateUserAvatar(userId, avatarUrl)  // ← NOVA
```

### Novo Export
```javascript
pool  // ← Acesso direto ao pool PostgreSQL se necessário
```

## 🚀 Próximas Etapas

1. **Preencher `.env` com credenciais Supabase**
   ```
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   JWT_SECRET=... (gerar novo)
   ```

2. **Criar bucket no Supabase**
   - Storage → Create bucket → `battle-city-images` (Public)

3. **Executar servidor**
   ```bash
   npm install
   npm start
   ```

4. **Testar conexão**
   ```bash
   curl http://localhost:3000/health
   ```

5. **Adicionar rotas de upload (opcional)**
   - Copie `image-routes.example.js`
   - Integre ao `server.js`
   - Use para upload de avatares

## 🐛 Testes Recomendados

```javascript
// 1. Conexão DB
GET /health

// 2. Autenticação
POST /auth/register → {"username": "test", "password": "123456"}
POST /auth/login → {"username": "test", "password": "123456"}

// 3. Upload de imagem (se adicionar rotas)
POST /api/images/upload-avatar (FormData com arquivo)

// 4. Leaderboard
GET /api/leaderboard
```

## ⚠️ Possíveis Problemas

| Erro | Solução |
|------|---------|
| ECONNREFUSED | Verifique DATABASE_URL e IPv4 connectivity |
| SSL error | Já tratado com `ssl: { rejectUnauthorized: false }` |
| auth error | Verifique SUPABASE_ANON_KEY no painel Supabase |
| Bucket not found | Crie o bucket `battle-city-images` manualmente |

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [Node PostgreSQL (pg)](https://node-postgres.com/)
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [image-routes.example.js](./image-routes.example.js)

---

**Status:** ✅ Migração Completa - Pronto para configuração
