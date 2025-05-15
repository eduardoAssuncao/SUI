const db = require('../config/dataBaseConfig');
const logger = require('../utils/logger');

class LocalAtendimento {
  /**
   * Busca um local de atendimento pelo ID
   * @param {number} id - ID do local
   * @returns {Promise<object|null>} - Dados do local ou null se não encontrado
   */
  static async buscarPorId(id) {
    try {
      const result = await db.query('SELECT * FROM locais_atendimento WHERE id = $1', [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Erro ao buscar local de atendimento por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todos os locais de atendimento de um serviço
   * @param {number} servicoId - ID do serviço
   * @returns {Promise<Array>} - Lista de locais de atendimento
   */
  static async listarPorServico(servicoId) {
    try {
      const query = `
        SELECT la.* 
        FROM locais_atendimento la
        JOIN servico_locais sl ON la.id = sl.local_atendimento_id
        WHERE sl.servico_id = $1 
        ORDER BY la.nome
      `;
      const result = await db.query(query, [servicoId]);
      return result.rows;
    } catch (error) {
      logger.error(`Erro ao listar locais de atendimento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria um novo local de atendimento
   * @param {object} local - Dados do local de atendimento
   * @returns {Promise<object>} - Local de atendimento criado
   */
  static async criar(local) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Primeiro, insere o local de atendimento
      const query = `
        INSERT INTO locais_atendimento 
        (nome, endereco, cep, telefone, horario_funcionamento, latitude, longitude) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        local.nome,
        local.endereco, 
        local.cep || null,
        local.telefone || null,
        local.horario_funcionamento || null,
        local.latitude || null,
        local.longitude || null
      ];
      
      const result = await client.query(query, values);
      const localCriado = result.rows[0];
      
      // Se houver um serviço associado, cria o relacionamento na tabela de junção
      if (local.servico_id) {
        await client.query(
          'INSERT INTO servico_locais (servico_id, local_atendimento_id) VALUES ($1, $2)',
          [local.servico_id, localCriado.id]
        );
      }
      
      await client.query('COMMIT');
      return { ...localCriado };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Erro ao criar local de atendimento: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Atualiza um local de atendimento existente
   * @param {number} id - ID do local
   * @param {object} local - Dados atualizados do local
   * @returns {Promise<boolean>} - true se sucesso
   */
  static async atualizar(id, local) {
    try {
      const setClauses = [];
      const params = [];
      let paramCount = 1;
      
      // Constrói a query de atualização dinamicamente
      if (local.servico_id !== undefined) {
        setClauses.push(`servico_id = $${paramCount++}`);
        params.push(local.servico_id);
      }
      
      if (local.nome !== undefined) {
        setClauses.push(`nome = $${paramCount++}`);
        params.push(local.nome);
      }
      
      if (local.endereco !== undefined) {
        setClauses.push(`endereco = $${paramCount++}`);
        params.push(local.endereco);
      }
      
      if (local.cep !== undefined) {
        setClauses.push(`cep = $${paramCount++}`);
        params.push(local.cep);
      }
      
      if (local.telefone !== undefined) {
        setClauses.push(`telefone = $${paramCount++}`);
        params.push(local.telefone);
      }
      
      if (local.horario_funcionamento !== undefined) {
        setClauses.push(`horario_funcionamento = $${paramCount++}`);
        params.push(local.horario_funcionamento);
      }
      
      if (local.latitude !== undefined) {
        setClauses.push(`latitude = $${paramCount++}`);
        params.push(local.latitude);
      }
      
      if (local.longitude !== undefined) {
        setClauses.push(`longitude = $${paramCount++}`);
        params.push(local.longitude);
      }
      
      if (setClauses.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }
      
      // Adiciona o ID como último parâmetro
      params.push(id);
      const whereClause = `id = $${paramCount}`;
      
      const query = `
        UPDATE locais_atendimento 
        SET ${setClauses.join(', ')}
        WHERE ${whereClause}
      `;
      
      const result = await db.query(query, params);
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Erro ao atualizar local de atendimento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove um local de atendimento pelo ID
   * @param {number} id - ID do local
   * @returns {Promise<boolean>} - true se removido com sucesso
   */
  static async remover(id) {
    try {
      const result = await db.query('DELETE FROM locais_atendimento WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Erro ao remover local de atendimento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove todos os locais de atendimento de um serviço
   * @param {number} servicoId - ID do serviço
   * @returns {Promise<boolean>} - true se removidos com sucesso
   */
  static async removerPorServico(servicoId) {
    try {
      // Remove apenas os relacionamentos, não os locais em si
      await db.query('DELETE FROM servico_locais WHERE servico_id = $1', [servicoId]);
      return true;
    } catch (error) {
      logger.error(`Erro ao remover relacionamentos de locais de atendimento por serviço: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Adiciona um local de atendimento a um serviço
   * @param {number} servicoId - ID do serviço
   * @param {number} localId - ID do local de atendimento
   * @returns {Promise<boolean>} - true se adicionado com sucesso
   */
  static async adicionarAoServico(servicoId, localId) {
    try {
      await db.query(
        'INSERT INTO servico_locais (servico_id, local_atendimento_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [servicoId, localId]
      );
      return true;
    } catch (error) {
      logger.error(`Erro ao adicionar local ao serviço: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Remove um local de atendimento de um serviço
   * @param {number} servicoId - ID do serviço
   * @param {number} localId - ID do local de atendimento
   * @returns {Promise<boolean>} - true se removido com sucesso
   */
  static async removerDoServico(servicoId, localId) {
    try {
      const result = await db.query(
        'DELETE FROM servico_locais WHERE servico_id = $1 AND local_atendimento_id = $2',
        [servicoId, localId]
      );
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Erro ao remover local do serviço: ${error.message}`);
      throw error;
    }
  }
}

module.exports = LocalAtendimento;