const mariadb = require('mariadb');
const logger = require('../utils/logger');

// Criação do pool de conexões com o banco de dados
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'andre',
  password: process.env.DB_PASSWORD || '280600',
  database: process.env.DB_NAME || 'servicos_publicos',
  connectionLimit: 10,
  connectTimeout: 10000
});

// Função para obter uma conexão do pool
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    logger.error('Erro ao conectar ao banco de dados:', error);
    throw new Error('Erro na conexão com o banco de dados');
  }
}

// Função para executar uma query
async function query(sql, params) {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.query(sql, params);
    return result;
  } catch (error) {
    logger.error('Erro ao executar query:', error);
    throw error;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

// Função para inicializar a conexão com o banco
async function initDatabase() {
  try {
    const conn = await getConnection();
    logger.info('Conexão com o banco de dados estabelecida com sucesso!');
    conn.release();
    return true;
  } catch (error) {
    logger.error('Falha ao inicializar o banco de dados:', error);
    return false;
  }
}

module.exports = {
  getConnection,
  query,
  initDatabase
};