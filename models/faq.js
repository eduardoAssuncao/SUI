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
      const result = await db.query('SELECT * FROM faq WHERE id = ?', [id]);
      return result.length > 0 ? result[0] : null;
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
      return await db.query(
        'SELECT * FROM faq WHERE servico_id = ? ORDER BY ordem, id',
        [servicoId]
      );
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
        'SELECT MAX(ordem) as max_ordem FROM faq WHERE servico_id = ?',
        [faq.servico_id]
      );
      
      const ordem = ordemResult[0].max_ordem !== null ? ordemResult[0].max_ordem + 1 : 0;
      
      const result = await db.query(
        'INSERT INTO faq (servico_id, pergunta, resposta, ordem) VALUES (?, ?, ?, ?)',
        [faq.servico_id, faq.pergunta, faq.resposta, ordem]
      );
      
      return { id: result.insertId, ...faq, ordem };
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
      let query = 'UPDATE faq SET ';
      const params = [];
      
      // Constrói a query de atualização dinamicamente
      if (faq.servico_id !== undefined) {
        query += 'servico_id = ?, ';
        params.push(faq.servico_id);
      }
      
      if (faq.pergunta !== undefined) {
        query += 'pergunta = ?, ';
        params.push(faq.pergunta);
      }
      
      if (faq.resposta !== undefined) {
        query += 'resposta = ?, ';
        params.push(faq.resposta);
      }
      
      if (faq.ordem !== undefined) {
        query += 'ordem = ?, ';
        params.push(faq.ordem);
      }
      
      // Remove a vírgula e o espaço no final
      query = query.slice(0, -2);
      
      query += ' WHERE id = ?';
      params.push(id);
      
      const result = await db.query(query, params);
      return result.affectedRows > 0;
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
      const result = await db.query('DELETE FROM faq WHERE id = ?', [id]);
      return result.affectedRows > 0;
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
      const result = await db.query('DELETE FROM faq WHERE servico_id = ?', [servicoId]);
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
    try {
      const conn = await db.getConnection();
      
      try {
        await conn.beginTransaction();
        
        for (let i = 0; i < ordenacao.length; i++) {
          await conn.query(
            'UPDATE faq SET ordem = ? WHERE id = ? AND servico_id = ?',
            [i, ordenacao[i], servicoId]
          );
        }
        
        await conn.commit();
        return true;
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      logger.error(`Erro ao reordenar perguntas frequentes: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Faq;