const { Pool } = require('pg');
const logger = require('../utils/logger');

// Parse da URL de conexão
const { parse } = require('pg-connection-string');
const config = parse(process.env.DATABASE_URL);

// Configuração do pool de conexões
const pool = new Pool({
  user: config.user,
  host: config.host,
  database: config.database,
  password: config.password,
  port: config.port,
  ssl: {
    rejectUnauthorized: false, // Desabilita a verificação do certificado SSL
    sslmode: 'require'
  },
  max: 10, // Número máximo de clientes no pool
  idleTimeoutMillis: 30000, // Tempo máximo que um cliente pode ficar inativo
  connectionTimeoutMillis: 10000, // Tempo máximo de espera por um cliente disponível
  application_name: 'sui-api' // Nome da aplicação para monitoramento
});

// Função para obter um cliente do pool
async function getClient() {
  try {
    const client = await pool.connect();
    logger.debug('Conexão com o banco de dados estabelecida');
    return client;
  } catch (error) {
    logger.error('Erro ao obter cliente do pool:', error);
    throw new Error('Erro na conexão com o banco de dados');
  }
}

// Função para executar uma query
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executada', { 
      text, 
      duration, 
      rows: res.rowCount 
    });
    return res;
  } catch (error) {
    logger.error('Erro ao executar query:', { 
      error: error.message, 
      query: text,
      params
    });
    throw error;
  }
}

// Função para executar uma transação
async function transaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Função para inicializar a conexão com o banco
async function initDatabase() {
  try {
    const client = await getClient();
    logger.info('Conexão com o PostgreSQL estabelecida com sucesso!');
    
    // Testar a conexão com uma consulta simples
    const result = await client.query('SELECT version()');
    logger.info('Versão do PostgreSQL:', result.rows[0].version);
    
    client.release();
    return true;
  } catch (error) {
    logger.error('Falha ao conectar ao PostgreSQL:', error);
    return false;
  }
}

module.exports = {
  getClient,
  query,
  transaction,
  initDatabase
};
