/**
 * Exemplo de rotas para upload de imagens no Supabase Storage
 * Copie e cole no seu server.js ou crie um arquivo separado e importe
 */

const express = require('express');
const multer = require('multer');
const db = require('./db');
const { uploadImage, deleteImage } = require('./supabase');
const { authMiddleware } = require('./auth');

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Apenas aceitar imagens
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Apenas arquivos de imagem são permitidos'));
    } else {
      cb(null, true);
    }
  }
});

// ─── Upload de Avatar do Usuário ────────────────────────────────────────────
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Nenhum arquivo enviado' });
    }

    console.log(`📸 Upload de avatar para usuário ${req.userId}`);

    // Fazer upload para Supabase
    const result = await uploadImage(req.file, 'battle-city-images');

    if (!result.success) {
      return res.status(500).json({ ok: false, error: result.error });
    }

    // Atualizar usuário no banco de dados
    await db.updateUserAvatar(req.userId, result.publicUrl);

    console.log(`✓ Avatar salvo: ${result.publicUrl}`);

    res.json({
      ok: true,
      url: result.publicUrl,
      fileName: result.fileName,
      path: result.path
    });
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ─── Deletar Avatar ─────────────────────────────────────────────────────────
router.delete('/delete-avatar/:filePath', authMiddleware, async (req, res) => {
  try {
    const filePath = req.params.filePath;
    
    console.log(`🗑️ Deletando imagem: ${filePath}`);

    // Deletar do Supabase Storage
    const result = await deleteImage(filePath, 'battle-city-images');

    if (!result.success) {
      return res.status(500).json({ ok: false, error: result.error });
    }

    // Remover URL do banco de dados
    await db.updateUserAvatar(req.userId, null);

    console.log('✓ Imagem deletada com sucesso');

    res.json({ ok: true, message: 'Imagem deletada' });
  } catch (error) {
    console.error('❌ Erro ao deletar:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ─── Obter Informações do Usuário (com avatar) ──────────────────────────────
router.get('/user/:id', async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;

/**
 * ─── COMO USAR NO SERVER.JS ────────────────────────────────────────────────
 * 
 * const imageRoutes = require('./image-routes');
 * app.use('/api/images', imageRoutes);
 * 
 * ─── EXEMPLOS DE REQUISIÇÕES ──────────────────────────────────────────────
 * 
 * 1. Upload de Avatar (FormData):
 *    POST /api/images/upload-avatar
 *    Headers: Authorization: Bearer seu-token-jwt
 *    Body: FormData com arquivo 'avatar'
 * 
 *    JavaScript:
 *    const formData = new FormData();
 *    formData.append('avatar', fileInput.files[0]);
 *    
 *    fetch('/api/images/upload-avatar', {
 *      method: 'POST',
 *      headers: { 'Authorization': `Bearer ${token}` },
 *      body: formData
 *    })
 *    .then(r => r.json())
 *    .then(data => console.log(data.url))
 * 
 * 2. Deletar Avatar:
 *    DELETE /api/images/delete-avatar/timestamp-random-filename.png
 *    Headers: Authorization: Bearer seu-token-jwt
 * 
 * 3. Obter Usuário:
 *    GET /api/images/user/123
 */
