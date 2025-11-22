// src/models/postModel.js

const { pool } = require('./connection.js');

/**
 * Converte o resultado do banco de dados para um objeto Post limpo.
 */
function formatPost(row) {
    if (!row) return null;
    return {
        postId: row.post_id,
        userId: row.user_id,
        username: row.username, // Adicionado para carregar no feed
        profilePictureUrl: row.profile_picture_url, // Adicionado para carregar no feed
        title: row.title,
        content: row.content,
        imageUrl: row.image_url, // Coluna que precisará ser adicionada no DB
        creationDate: row.creation_date,
    };
}

/**
 * Cria um novo post/carta pública.
 */
async function createPost(userId, title, content, imageUrl = null) {
    const [result] = await pool.query(
        'INSERT INTO Posts (user_id, title, content, image_url) VALUES (?, ?, ?, ?)',
        [userId, title, content, imageUrl]
    );
    return result.insertId; 
}

/**
 * Busca todos os posts para o feed, com dados do autor.
 */
async function getAllPosts() {
    // Junta a tabela Posts com a tabela Users para pegar o nome e a foto de perfil
    const [rows] = await pool.query(`
        SELECT 
            p.post_id, p.user_id, p.title, p.content, p.image_url, p.creation_date,
            u.username, u.profile_picture_url
        FROM Posts p
        JOIN Users u ON p.user_id = u.user_id
        ORDER BY p.creation_date DESC
        LIMIT 50 -- Limita para não sobrecarregar
    `);
    return rows.map(formatPost);
}

/**
 * Conta o número de posts (cartas públicas) de um usuário.
 */
async function countPostsByUserId(userId) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as postCount FROM Posts WHERE user_id = ?',
        [userId]
    );
    return rows[0].postCount;
}

async function getPostsByUserId(userId) {
    const [rows] = await pool.query(`
        SELECT 
            post_id, title, content, image_url, creation_date
        FROM Posts
        WHERE user_id = ?
        ORDER BY creation_date DESC
    `, [userId]);
    
    // Retorna os dados crus (post_id, title, image_url) para o grid
    return rows; 
}

module.exports = {
    createPost,
    getAllPosts,
    countPostsByUserId,
    getPostsByUserId, // NOVO: Adiciona a função de buscar posts do usuário
};