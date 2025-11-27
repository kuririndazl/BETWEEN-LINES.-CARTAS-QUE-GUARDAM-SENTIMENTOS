const { pool } = require('./connection.js');
// src/controllers/userController.js

const userModel = require('../models/userModel.js');
const postModel = require('../models/postModel.js'); // NOVO: Importa o model de posts
const path = require('path');
const fs = require('fs'); 

exports.getProfilePage = async (req, res) => {
    const user = res.locals.user;
    
    try {
        // NOVO: Conta o número real de posts (cartas públicas)
        const postCount = await postModel.countPostsByUserId(user.user_id); 
    
        // Dados de estatísticas mockados para o EJS (apenas lettersSent/Received)
        const stats = {
            lettersSent: 42, // Mantenha como mock ou implemente a contagem de Direct_Letters
            lettersReceived: 18, // Mantenha como mock ou implemente a contagem de Direct_Letters
            postCount: postCount, // Adiciona a contagem real de posts
        };

        res.render('pages/profile', { profile: user, stats: stats });

    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        // Em caso de erro, renderiza com zero posts, mas exibe o perfil
        const stats = { lettersSent: 0, lettersReceived: 0, postCount: 0 };
        res.render('pages/profile', { profile: user, stats: stats });
    }
};

// ... (Resto do código do userController.js permanece o mesmo)

/**
 * Converte o resultado do banco de dados para um objeto User limpo.
 * @param {object} row O resultado da linha do MySQL.
 * @returns {object} O objeto User formatado.
 */
function formatUser(row) {
    if (!row) return null;
    return {
        user_id: row.user_id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash, // Para compatibilidade com o controller de autenticação
        profilePictureUrl: row.profile_picture_url || '/public/images/default_avatar.png',
        bio: row.bio || 'Sem biografia ainda.',
        joinDate: row.join_date,
        isBanned: row.is_banned
    };
}


async function createUser(username, email, passwordHash) {
    const [result] = await pool.query(
        'INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)', 
        [username, email, passwordHash]
    );
    return result.insertId; 
}

/**
 * Busca um usuário pelo email.
 */
async function findUserByEmail(email) {
    const [rows] = await pool.query(
        'SELECT user_id, username, email, password_hash, profile_picture_url, bio, join_date, is_banned FROM Users WHERE email = ?',
        [email]
    );
    return formatUser(rows[0]);
}

/**
 * Busca um usuário pelo ID. ESSENCIAL para carregar a página de perfil.
 */
async function findUserById(userId) {
    const [rows] = await pool.query(
        'SELECT user_id, username, email, profile_picture_url, bio, join_date, is_banned FROM Users WHERE user_id = ?',
        [userId]
    );
    return formatUser(rows[0]);
}

/**
 * Atualiza o username e a bio do usuário.
 */
async function updateUserProfile(userId, username, bio) {
    const [result] = await pool.query(
        'UPDATE Users SET username = ?, bio = ? WHERE user_id = ?',
        [username, bio, userId]
    );
    return result.affectedRows > 0;
}

/**
 * Atualiza a URL da foto de perfil.
 */
async function updateProfilePicture(userId, profilePictureUrl) {
    const [result] = await pool.query(
        'UPDATE Users SET profile_picture_url = ? WHERE user_id = ?',
        [profilePictureUrl, userId]
    );
    return result.affectedRows > 0;
}


async function countSentDirectLetters(userId) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as sentCount FROM Direct_Letters WHERE sender_id = ?',
        [userId]
    );
    // Retorna 0 se o array de rows estiver vazio ou a contagem não estiver definida
    return rows[0] ? rows[0].sentCount : 0;
}

/**
 * Conta o número de cartas diretas recebidas por um usuário.
 */
async function countReceivedDirectLetters(userId) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as receivedCount FROM Direct_Letters WHERE receiver_id = ?',
        [userId]
    );
    return rows[0] ? rows[0].receivedCount : 0;
}

async function followUser(followerId, followingId) {
    if (followerId === followingId) return false;

    const [result] = await pool.query(
        'INSERT IGNORE INTO Follows (follower_id, following_id) VALUES (?, ?)',
        [followerId, followingId]
    );
    return result.affectedRows > 0;
}

/**
 * Remove um relacionamento de 'seguir'.
 */
async function unfollowUser(followerId, followingId) {
    const [result] = await pool.query(
        'DELETE FROM Follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
    );
    return result.affectedRows > 0;
}

/**
 * Verifica se um usuário está seguindo outro.
 */
async function isFollowing(followerId, followingId) {
    const [rows] = await pool.query(
        'SELECT 1 FROM Follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
        [followerId, followingId]
    );
    return rows.length > 0;
}

module.exports = {
    createUser, 
    findUserByEmail,
    findUserById,
    updateUserProfile,
    updateProfilePicture,
    countSentDirectLetters, 
    countReceivedDirectLetters,
    followUser,
    unfollowUser,
    isFollowing
}