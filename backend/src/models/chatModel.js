// src/models/chatModel.js
const { pool } = require('./connection.js');

// --- Funções de Chat ---

/**
 * Encontra ou cria uma conversa entre dois usuários.
 * Retorna o conversation_id.
 */
async function findOrCreateConversation(userId1, userId2) {
    const [userA, userB] = [userId1, userId2].sort((a, b) => a - b); 

    const [rows] = await pool.query(
        'SELECT conversation_id FROM ChatConversations WHERE user1_id = ? AND user2_id = ?',
        [userA, userB]
    );

    if (rows.length > 0) {
        return rows[0].conversation_id;
    }

    const [result] = await pool.query(
        'INSERT INTO ChatConversations (user1_id, user2_id) VALUES (?, ?)',
        [userA, userB]
    );
    return result.insertId;
}

/**
 * Registra uma nova mensagem no banco de dados.
 */
async function createChatMessage(conversationId, senderId, content, type = 'text', mediaUrl = null) {
    const [result] = await pool.query(
        'INSERT INTO ChatMessages (conversation_id, sender_id, content, type, media_url) VALUES (?, ?, ?, ?, ?)',
        [conversationId, senderId, content, type, mediaUrl]
    );
    return result.insertId;
}

/**
 * Obtém todas as mensagens de uma conversa.
 */
async function getMessagesByConversationId(conversationId) {
    const [rows] = await pool.query(`
        SELECT 
            m.message_id, m.sender_id, m.content, m.type, m.media_url, m.timestamp,
            u.username, u.profile_picture_url
        FROM ChatMessages m
        JOIN Users u ON m.sender_id = u.user_id
        WHERE m.conversation_id = ?
        ORDER BY m.timestamp ASC
    `, [conversationId]);
    return rows;
}


/**
 * CORREÇÃO: Função para registrar uma "carta privada" para estatística.
 * Adiciona a coluna 'content' para evitar o erro ER_NO_DEFAULT_FOR_FIELD.
 */
async function registerPrivateLetter(senderId, receiverId) {
    // ATENÇÃO: Se 'content' é obrigatório na Direct_Letters, precisamos fornecer um valor.
    const [result] = await pool.query(
        'INSERT INTO Direct_Letters (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [senderId, receiverId, 'Chat Message'] // Adiciona o valor padrão para 'content'
    );
    return result.insertId;
}

module.exports = {
    findOrCreateConversation,
    createChatMessage,
    getMessagesByConversationId,
    registerPrivateLetter,
};