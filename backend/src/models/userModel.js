const { pool } = require('./connection');

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


module.exports = {
    createUser, 
    findUserByEmail,
    findUserById, // Novo
    updateUserProfile, // Novo
    updateProfilePicture // Novo
}