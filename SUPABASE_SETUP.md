# Guia de Integração com Supabase

Este projeto foi migrado de SQLite para **Supabase PostgreSQL** + **Supabase Storage**.

## Configuração Inicial

### 1. Criar Conta e Projeto no Supabase

- Acesse [supabase.com](https://supabase.com)
- Crie uma conta gratuita
- Crie um novo projeto (escolha AWS região `us-west-2` se possível)
- Aguarde a criação (leva alguns minutos)

### 2. Obter Credenciais

No painel do Supabase:

1. **Para Conexão PostgreSQL:**
   - Vá para `Project Settings` → `Database`
   - Procure por "Connection Pooler"
   - Copie a URI com o format:
     ```
     postgresql://postgres.USER:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres
     ```

2. **Para Storage e API:**
   - Vá para `Project Settings` → `API`
   - Copie:
     - `URL` (ex: https://xxxx.supabase.co)
     - `anon key` (chave pública)
     - `service_role key` (chave privada - manter segura)

### 3. Configurar Arquivo `.env`

```env
# Banco de dados
DATABASE_URL=postgresql://postgres.USER:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres

# Supabase API
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=gere-um-secret-aleatorio-e-complexo

# Storage
SUPABASE_STORAGE_BUCKET=battle-city-images
```

### 4. Criar Storage Bucket

No painel Supabase:
1. Vá para `Storage` (menu lateral)
2. Clique em `Create new bucket`
3. Nome: `battle-city-images`
4. Defina como **Public** (para servir imagens públicas)
5. Salve

### 5. Instalar Dependências

```bash
npm install
```

Será instalado:
- `pg` - Cliente PostgreSQL
- `@supabase/supabase-js` - SDK Supabase
- `dotenv` - Variáveis de ambiente

### 6. Executar Servidor

```bash
npm start
```

O servidor vai:
- Conectar ao PostgreSQL via Supabase
- Criar as tabelas automaticamente (se não existirem)
- Ficar pronto para receber requisições

## Usar Storage de Imagens

### Fazer Upload

```javascript
const { uploadImage } = require('./supabase');
const multer = require('multer');

// Configurar multer
const upload = multer({ storage: multer.memoryStorage() });

// Rota de upload
app.post('/api/upload-avatar', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const result = await uploadImage(req.file);
  
  if (result.success) {
    // Atualizar usuário com URL da imagem
    await db.updateUserAvatar(req.userId, result.publicUrl);
    res.json({ url: result.publicUrl, path: result.path });
  } else {
    res.status(500).json({ error: result.error });
  }
});
```

### Deletar Imagem

```javascript
const { deleteImage } = require('./supabase');

app.delete('/api/image/:path', async (req, res) => {
  const result = await deleteImage(req.params.path);
  
  if (result.success) {
    res.json({ ok: true });
  } else {
    res.status(500).json({ error: result.error });
  }
});
```

## Migração de Dados (Se Necessário)

Para migrar dados do SQLite antigo para PostgreSQL:

```bash
# 1. Exportar dados do SQLite
sqlite3 data/battle-city.db ".mode csv" > dados.csv

# 2. Importar para PostgreSQL via Supabase
# Use o painel do Supabase ou um script de migração
```

## Troubleshooting

### Erro: "ECONNREFUSED"
- Verifique se a conexão IPv4 está funcionando
- Teste com: `telnet aws-1-us-west-2.pooler.supabase.com 6543`

### Erro: "SSL required"
- Já é tratado no código (ssl: { rejectUnauthorized: false })

### Erro: "Bucket not found"
- Verifique se criou o bucket `battle-city-images` no Supabase Storage

### Erro: "anon key not valid"
- Verifique se copiou corretamente a chave do painel do Supabase
- Não confunda com a service_role_key

## Recursos Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [PostgreSQL Client (pg)](https://node-postgres.com/)
- [Supabase JS SDK](https://supabase.com/docs/reference/javascript)

## Segurança

- ⚠️ Nunca commite o arquivo `.env` no git
- ⚠️ Mantenha `SUPABASE_SERVICE_ROLE_KEY` segura (apenas no servidor)
- ⚠️ Use `SUPABASE_ANON_KEY` no frontend
- ⚠️ Configure Row Level Security (RLS) no Supabase para produção
