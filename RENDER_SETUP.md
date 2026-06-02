# 🚀 Deploy no Render.com

## ✅ Por que Render é a melhor opção para Battle City

- **WebSocket Nativo**: Socket.io funciona perfeitamente
- **Free Tier Generoso**: Até ~$7/mês em créditos
- **Auto-deploy**: Conecta com GitHub - deploy automático a cada push
- **Suporta Node.js**: Com npm, Node 18+
- **Persistência**: Disco para SQLite database
- **Performance**: Melhor do que HTTP polling do Vercel

---

## 📋 Passo a Passo

### 1️⃣ Criar Conta no Render

1. Acesse: https://render.com
2. Clique em **Sign up**
3. Conecte com GitHub (recomendado)

### 2️⃣ Conectar Repositório

1. No Dashboard Render, clique em **New +**
2. Selecione **Web Service**
3. Escolha seu repositório `battle-city`
4. Preencha:
   - **Name**: `battle-city`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`

### 3️⃣ Configurar Variáveis de Ambiente

Clique em **Environment** e adicione:

```
NODE_ENV = production
PORT = 10000
JWT_SECRET = sua_chave_super_secreta_aqui
```

Se usar Firebase/Supabase:
```
FIREBASE_API_KEY = seu_valor
FIREBASE_AUTH_DOMAIN = seu_valor
SUPABASE_URL = seu_valor
SUPABASE_KEY = seu_valor
```

### 4️⃣ Deploy

Clique em **Create Web Service**

- Render começará a fazer build automaticamente
- Quando terminar, você receberá uma URL como: `https://battle-city-xxx.onrender.com`

---

## 🔄 Auto-Deploy (Importante!)

Render detecta automaticamente pushes no GitHub:

```bash
# Quando você fizer isso:
git push origin main

# Render AUTOMATICAMENTE:
# 1. Puxa as mudanças
# 2. Instala dependências
# 3. Inicia o servidor
# Sem precisar fazer nada! ✨
```

---

## 📊 Monitorar

No Dashboard Render:
- **Logs**: Ver o que está acontecendo em tempo real
- **Metrics**: CPU, memória, requisições
- **Redeploy**: Botão para forçar rebuild

---

## ⚠️ Limitações do Free Tier

- Aplicação para depois de 15 min inativo (tire isso clicando em "Upgrade")
- Máximo 100GB/mês de banda
- 1 Web Service + 1 Database gratuito

**Para uso sem parar**: ~$7/mês (ainda é barato!)

---

## 🧪 Testar Localmente Antes

```bash
# 1. Instalar
npm install --legacy-peer-deps

# 2. Rodar (Port 10000 como Render)
PORT=10000 npm start

# 3. Acessar
# http://localhost:10000
```

---

## 📝 Arquivo `render.yaml` Incluído

Este arquivo já tem tudo configurado para Render:
- Runtime Node.js
- Build command correto
- Start command correto
- Variáveis de ambiente
- Disco persistente para SQLite

Render lerá automaticamente este arquivo!

---

## 🆘 Se Algo Der Errado

1. **Verifique os logs** no Render Dashboard
2. **Confirme Node.js >= 18** (mostrado nos logs)
3. **Teste localmente** antes: `PORT=10000 npm start`
4. **Variáveis de ambiente**: Todas definidas no Dashboard?

---

**Status**: ✅ Pronto para Deploy em Render
**Recomendação**: Use Render em vez de Back4App para WebSocket nativo!
