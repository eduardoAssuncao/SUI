const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
const logger = require('../utils/logger');

// Configuração padrão para desenvolvimento local
let poolConfig = {
  user: 'postgres',
  host: 'db.bwvvghtzwquxxfwwhsvt.supabase.co',
  database: 'postgres',
  password: '87235082',
  port: 5432,
  ssl: { 
    rejectUnauthorized: false 
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  application_name: 'sui-api'
};

// Se tiver DATABASE_URL, sobrescreve as configurações
if (process.env.DATABASE_URL) {
  try {
    const config = parse(process.env.DATABASE_URL);
    poolConfig = {
      ...poolConfig,
      ...config,
      ssl: config.sslmode === 'require' 
        ? { rejectUnauthorized: false } 
        : false
    };
  } catch (error) {
    logger.error('Erro ao analisar DATABASE_URL:', error);
  }
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
