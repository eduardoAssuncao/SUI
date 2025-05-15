const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
const logger = require('../utils/logger');

let poolConfig;

// Se tiver DATABASE_URL, usa ela, senão usa as variáveis de ambiente individuais
if (process.env.DATABASE_URL) {
  const config = parse(process.env.DATABASE_URL);
  poolConfig = {
    user: config.user,
    host: config.host,
    database: config.database,
    password: config.password,
    port: config.port,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    application_name: 'sui-api'
  };
} else {
  // Configuração padrão para desenvolvimento local
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'servicos_publicos',
    password: process.env.DB_PASSWORD || '1234',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    application_name: 'sui-api'
  };
}

// Cria uma instância do pool de conexões
const pool = new Pool(poolConfig);

// Testa a conexão com o banco de dados
pool.query('SELECT NOW()', (err) => {
  if (err) {
    logger.error('Erro ao conectar ao banco de dados:', err);
  } else {
    logger.info('Conexão com o banco de dados estabelecida com sucesso');
  }
});

// Função para executar queries com log
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executada em ${duration}ms`);
    return res;
  } catch (error) {
    logger.error(`Erro ao executar query: ${error.message}`, {
      query: text,
      params,
      stack: error.stack
    });
    throw error;
  }
};

// Função para obter um cliente do pool
const getClient = async () => {
  try {
    const client = await pool.connect();
    logger.debug('Cliente obtido do pool de conexões');
    
    // Adiciona um método de query com log
    const query = client.query;
    const release = client.release;
    
    // Configura um timeout para evitar vazamento de conexões
    const timeout = setTimeout(() => {
      logger.error('Um cliente foi retido por mais de 30 segundos');
    }, 30000);
    
    // Sobrescreve o método release para limpar o timeout
    client.release = () => {
      clearTimeout(timeout);
      client.release = release;
      return release.apply(client);
    };
    
    // Sobrescreve o método query para adicionar log
    client.query = (...args) => {
      return query.apply(client, args);
    };
    
    return client;
  } catch (error) {
    logger.error('Erro ao obter cliente do pool:', error);
    throw error;
  }
};

// Função para executar uma transação
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Erro na transação:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Função para inicializar a conexão com o banco
const initDatabase = async () => {
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
};

// Exporta as funções e o pool
module.exports = {
  query,
  getClient,
  pool,
  transaction,
  initDatabase,
  getConnection: async () => {
    try {
      const client = await pool.connect();
      return {
        query: (text, params) => client.query(text, params),
        release: () => client.release(),
        ...client
      };
    } catch (error) {
      logger.error('Erro ao obter conexão do pool:', error);
      throw error;
    }
  }
};