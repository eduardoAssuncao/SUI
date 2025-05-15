const db = require('../config/dataBaseConfig');
const logger = require('../utils/logger');

class Faq {
  /**
   * Busca uma pergunta frequente pelo ID
   * @param {number} id - ID da pergunta
   * @returns {Promise<object|null>} - Dados da pergunta ou null se não encontrada
   */
  static async buscarPorId(id) {
    try {
      const result = await db.query('SELECT * FROM faqs WHERE id = $1', [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Erro ao buscar pergunta frequente por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todas as perguntas frequentes de um serviço
   * @param {number} servicoId - ID do serviço
   * @returns {Promise<Array>} - Lista de perguntas frequentes
   */
  static async listarPorServico(servicoId) {
    try {
      const result = await db.query(
        'SELECT * FROM faqs WHERE servico_id = $1 ORDER BY ordem, id',
        [servicoId]
      );
      return result.rows;
    } catch (error) {
      logger.error(`Erro ao listar perguntas frequentes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria uma nova pergunta frequente
   * @param {object} faq - Dados da pergunta frequente
   * @returns {Promise<object>} - Pergunta frequente criada
   */
  static async criar(faq) {
    try {
      // Busca a maior ordem para o serviço
      const ordemResult = await db.query(
        'SELECT MAX(ordem) as max_ordem FROM faqs WHERE servico_id = $1',
        [faq.servico_id]
      );
      
      const ordem = ordemResult.rows[0].max_ordem !== null ? ordemResult.rows[0].max_ordem + 1 : 0;
      
      const result = await db.query(
        'INSERT INTO faqs (servico_id, pergunta, resposta, ordem, ativo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [faq.servico_id, faq.pergunta, faq.resposta, ordem, faq.ativo]
      );
      
      return { ...result.rows[0] };
    } catch (error) {
      logger.error(`Erro ao criar pergunta frequente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza uma pergunta frequente existente
   * @param {number} id - ID da pergunta
   * @param {object} faq - Dados atualizados da pergunta
   * @returns {Promise<boolean>} - true se sucesso
   */
  static async atualizar(id, faq) {
    try {
      const setClauses = [];
      const params = [];
      let paramCount = 1;
      
      // Constrói a query de atualização dinamicamente
      if (faq.servico_id !== undefined) {
        setClauses.push(`servico_id = $${paramCount++}`);
        params.push(faq.servico_id);
      }
      
      if (faq.pergunta !== undefined) {
        setClauses.push(`pergunta = $${paramCount++}`);
        params.push(faq.pergunta);
      }
      
      if (faq.resposta !== undefined) {
        setClauses.push(`resposta = $${paramCount++}`);
        params.push(faq.resposta);
      }
      
      if (faq.ordem !== undefined) {
        setClauses.push(`ordem = $${paramCount++}`);
        params.push(faq.ordem);
      }
      
      if (setClauses.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }
      
      // Adiciona o ID como último parâmetro
      params.push(id);
      const whereClause = `id = $${paramCount}`;
      
      const query = `
        UPDATE faq 
        SET ${setClauses.join(', ')}
        WHERE ${whereClause}
      `;
      
      const result = await db.query(query, params);
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Erro ao atualizar pergunta frequente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove uma pergunta frequente pelo ID
   * @param {number} id - ID da pergunta
   * @returns {Promise<boolean>} - true se removida com sucesso
   */
  static async remover(id) {
    try {
      const result = await db.query('DELETE FROM faqs WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Erro ao remover pergunta frequente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove todas as perguntas frequentes de um serviço
   * @param {number} servicoId - ID do serviço
   * @returns {Promise<boolean>} - true se removidas com sucesso
   */
  static async removerPorServico(servicoId) {
    try {
      await db.query('DELETE FROM faqs WHERE servico_id = $1', [servicoId]);
      return true;
    } catch (error) {
      logger.error(`Erro ao remover perguntas frequentes por serviço: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reordena as perguntas frequentes
   * @param {number} servicoId - ID do serviço
   * @param {Array} ordenacao - Array com IDs na ordem desejada
   * @returns {Promise<boolean>} - true se reordenadas com sucesso
   */
  static async reordenar(servicoId, ordenacao) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < ordenacao.length; i++) {
        await client.query(
          'UPDATE faqs SET ordem = $1 WHERE id = $2 AND servico_id = $3',
          [i, ordenacao[i], servicoId]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Faq;