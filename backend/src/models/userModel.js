const { pool } = require('./connection');

async function createUser(username, email, passwordHash) {
    const [result] = await pool.query(
        'INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, passwordHash]);
    return result.insertId; 
}

async function findUserByEmail(email) {
    const [rows] = await pool.query(
        'SELECT user_id, username, email, password_hash, is_banned FROM Users WHERE email = ?',
        [email]
    );
    // Renomeando a coluna password_hash para passwordHash para corresponder ao controller
    if (rows && rows.length > 0) {
        const user = rows[0];
        user.passwordHash = user.password_hash;
        delete user.password_hash;
        return user;
    }
    return null; 
}

module.exports = { createUser,findUserByEmail };