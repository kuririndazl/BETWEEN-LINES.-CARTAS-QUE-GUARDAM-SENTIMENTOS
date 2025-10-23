const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    connection.release();
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
    // Pode ser útil encerrar o processo se a conexão falhar criticamente
    // process.exit(1); 
  }
}

// Chamar a função de teste
testConnection();

module.exports = {pool};