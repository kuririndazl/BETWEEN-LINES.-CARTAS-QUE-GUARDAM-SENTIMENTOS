const { pool } = require('./connection');

//Cria um novo usuário no DB (usado no Cadastro)
async function createUser(username, email, passwordHash) {
    //A senha tem que vir criptografada do controller
    const [result] = await pool.query( // await pool query(comando) para passar um comando sql
        'INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
    );
    // Retorna o ID do novo usuário (útil para login automático pós-cadastro)
    return result.insertId; 
}

//Busca um usuário pelo email (usado no Login)
async function findUserByEmail(email) {
    const [rows] = await pool.query(
        'SELECT * FROM Users WHERE email = ?',
        [email]
    );
    // Retorna o objeto do usuário ou 'undefined' se não encontrado
    return rows[0]; 
}

module.exports = {
    createUser,
    findUserByEmail,
};