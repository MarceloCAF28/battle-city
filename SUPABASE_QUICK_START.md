# Battle City - Integração Supabase ✅

Seu projeto foi migrado de **SQLite** para **Supabase PostgreSQL** + **Supabase Storage**.

## 🚀 Início Rápido

### 1. Obter Credenciais Supabase
- Acesse [supabase.com](https://supabase.com)
- Crie um projeto (escolha a região `us-west-2`)
- Copie as credenciais (veja `SUPABASE_SETUP.md`)

### 2. Configurar `.env`
```bash
# Copie e preencha as credenciais do Supabase
DATABASE_URL=postgresql://postgres.USER:PASSWORD@aws-1-us-west-2.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada
JWT_SECRET=seu-secret-aleatorio
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Criar Storage Bucket
No painel Supabase:
- Storage → Create bucket
- Nome: `battle-city-images`
- Tipo: Public

### 5. Executar
```bash
npm start
```

## 📁 Arquivos Criados/Modificados

| Arquivo | O que mudou |
|---------|-----------|
| `db.js` | SQLite → PostgreSQL (Supabase) |
| `supabase.js` | **NOVO** - Configuração Supabase |
| `.env` | **NOVO** - Credenciais (não commitar!) |
| `package.json` | Substituído sqlite3 por pg + @supabase/supabase-js |
| `.gitignore` | Atualizado para proteger .env |
| `SUPABASE_SETUP.md` | **NOVO** - Guia completo de configuração |
| `image-routes.example.js` | **NOVO** - Exemplo de rotas para upload |

## ✨ Recursos Disponíveis

### ✅ Banco de Dados (PostgreSQL)
- Tabelas: users, matches, match_players, player_stats
- Pool de conexões otimizado
- Índices para melhor performance

### ✅ Storage de Imagens
- Upload/delete de arquivos
- URLs públicas automáticas
- Limite: 5MB por arquivo
- Apenas imagens (JPEG, PNG, WebP, etc)

### ✅ Autenticação
- JWT tokens
- Senha com hash bcrypt
- Middleware de autenticação

## 🔗 Diferenças SQLite → PostgreSQL

### Sintaxe de Parâmetros
```javascript
// SQLite (antigo)
db.run('INSERT INTO users VALUES (?, ?, ?)', [a, b, c])

// PostgreSQL (novo) 
db.run('INSERT INTO users VALUES ($1, $2, $3)', [a, b, c])
```

### Tipos de Dados
- `TEXT` → `TEXT` (igual)
- `INTEGER` → `SERIAL` (auto-increment)
- `DATETIME` → `TIMESTAMP`
- `REAL` → `REAL`

### Retorno de IDs
```javascript
// Agora usa RETURNING
const result = await dbRun(
  'INSERT INTO users (...) VALUES (...) RETURNING id',
  params
);
```

## 🆘 Troubleshooting

**Erro: Connection refused**
```
→ Verifique DATABASE_URL
→ Teste conectividade IPv4
```

**Erro: anon key not valid**
```
→ Copie novamente do painel Supabase
→ Não confunda com service_role_key
```

**Erro: Bucket not found**
```
→ Crie o bucket battle-city-images no Storage
→ Configure como Public
```

## 📚 Próximos Passos

1. **Adicionar upload de avatares** - Use `image-routes.example.js`
2. **Configurar RLS** - Row Level Security no painel Supabase (produção)
3. **Backup** - Configure backups automáticos no Supabase
4. **Monitoramento** - Use o dashboard do Supabase

## 📖 Documentação

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Guia completo
- [image-routes.example.js](./image-routes.example.js) - Exemplos de código
- [Docs Supabase](https://supabase.com/docs)

---

**Dúvidas?** Consulte o arquivo `SUPABASE_SETUP.md` para mais detalhes!
