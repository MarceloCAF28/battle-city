require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Validar variáveis de ambiente
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios no .env');
  process.exit(1);
}

// Cliente Supabase para Storage e Auth
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Função para fazer upload de imagem
async function uploadImage(file, bucket = process.env.SUPABASE_STORAGE_BUCKET || 'battle-city-images') {
  try {
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    // Gerar URL pública
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      success: true,
      fileName: fileName,
      publicUrl: publicData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para deletar imagem
async function deleteImage(filePath, bucket = process.env.SUPABASE_STORAGE_BUCKET || 'battle-city-images') {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  supabase,
  uploadImage,
  deleteImage
};
