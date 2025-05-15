const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { parse } = require('pg-connection-string');
require('dotenv').config();

// Parse da URL de conexão
const config = parse(process.env.DATABASE_URL);

// Configuração explícita do pool
const pool = new Pool({
  user: config.user,
  host: config.host,
  database: config.database,
  password: config.password,
  port: config.port,
  ssl: {
    rejectUnauthorized: false,
    // Para ambientes de desenvolvimento, você pode adicionar isso
    // Em produção, use certificados válidos
    sslmode: 'require'
  },
  // Opções adicionais
  max: 10, // Número máximo de clientes no pool
  idleTimeoutMillis: 30000, // Tempo máximo que um cliente pode ficar inativo
  connectionTimeoutMillis: 10000 // Tempo máximo de espera por um cliente disponível
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Cria a tabela de controle de migrações se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    // Obtém as migrações já executadas
    const { rows: executedMigrations } = await client.query(
      'SELECT name FROM migrations ORDER BY name'
    );
    
    const executedMigrationNames = new Set(executedMigrations.map(m => m.name));
    const migrationDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log('Verificando migrações pendentes...');
    
    for (const file of migrationFiles) {
      if (!executedMigrationNames.has(file)) {
        console.log(`Executando migração: ${file}`);
        const migrationSQL = fs.readFileSync(path.join(migrationDir, file), 'utf8');
        await client.query(migrationSQL);
        
        // Registra a migração como executada
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        
        console.log(`Migração concluída: ${file}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('Todas as migrações foram aplicadas com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
