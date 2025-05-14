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
      const result = await db.query('SELECT * FROM locais_atendimento WHERE id = ?', [id]);
      return result.length > 0 ? result[0] : null;
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
      return await db.query(
        'SELECT * FROM locais_atendimento WHERE servico_id = ? ORDER BY nome',
        [servicoId]
      );
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
    try {
      const result = await db.query(
        `INSERT INTO locais_atendimento 
         (servico_id, nome, endereco, cep, telefone, horario_funcionamento, latitude, longitude) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          local.servico_id,
          local.nome,
          local.endereco, 
          local.cep || null,
          local.telefone || null,
          local.horario_funcionamento || null,
          local.latitude || null,
          local.longitude || null
        ]
      );
      
      return { id: result.insertId, ...local };
    } catch (error) {
      logger.error(`Erro ao criar local de atendimento: ${error.message}`);
      throw error;
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
      let query = 'UPDATE locais_atendimento SET ';
      const params = [];
      
      // Constrói a query de atualização dinamicamente
      if (local.servico_id !== undefined) {
        query += 'servico_id = ?, ';
        params.push(local.servico_id);
      }
      
      if (local.nome !== undefined) {
        query += 'nome = ?, ';
        params.push(local.nome);
      }
      
      if (local.endereco !== undefined) {
        query += 'endereco = ?, ';
        params.push(local.endereco);
      }
      
      if (local.cep !== undefined) {
        query += 'cep = ?, ';
        params.push(local.cep);
      }
      
      if (local.telefone !== undefined) {
        query += 'telefone = ?, ';
        params.push(local.telefone);
      }
      
      if (local.horario_funcionamento !== undefined) {
        query += 'horario_funcionamento = ?, ';
        params.push(local.horario_funcionamento);
      }
      
      if (local.latitude !== undefined) {
        query += 'latitude = ?, ';
        params.push(local.latitude);
      }
      
      if (local.longitude !== undefined) {
        query += 'longitude = ?, ';
        params.push(local.longitude);
      }
      
      // Remove a vírgula e o espaço no final
      query = query.slice(0, -2);
      
      query += ' WHERE id = ?';
      params.push(id);
      
      const result = await db.query(query, params);
      return result.affectedRows > 0;
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
      const result = await db.query('DELETE FROM locais_atendimento WHERE id = ?', [id]);
      return result.affectedRows > 0;
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
      const result = await db.query('DELETE FROM locais_atendimento WHERE servico_id = ?', [servicoId]);
      return true;
    } catch (error) {
      logger.error(`Erro ao remover locais de atendimento por serviço: ${error.message}`);
      throw error;
    }
  }
}

module.exports = LocalAtendimento;