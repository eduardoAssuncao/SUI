const db = require('../config/dataBaseConfig');
const logger = require('../utils/logger');

class Categoria {
  /**
   * Busca uma categoria pelo ID
   * @param {number} id - ID da categoria
   * @returns {Promise<object|null>} - Dados da categoria ou null se não encontrada
   */
  static async buscarPorId(id) {
    try {
      const query = {
        text: 'SELECT * FROM categorias WHERE id = $1',
        values: [id]
      };
      const result = await db.query(query);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Erro ao buscar categoria por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todas as categorias
   * @returns {Promise<Array>} - Lista de categorias
   */
  static async listarTodas() {
    try {
      const query = {
        text: `
          SELECT c.*, COUNT(s.id) as total_servicos
          FROM categorias c
          LEFT JOIN servicos s ON c.id = s.categoria_id AND s.ativo = true
          GROUP BY c.id
          ORDER BY c.nome
        `
      };
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`Erro ao listar categorias: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria uma nova categoria
   * @param {object} categoria - Dados da categoria
   * @returns {Promise<object>} - Categoria criada
   */
  static async criar(categoria) {
    try {
      const query = {
        text: 'INSERT INTO categorias (nome, descricao, icone) VALUES ($1, $2, $3) RETURNING *',
        values: [categoria.nome, categoria.descricao || null, categoria.icone || null]
      };
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error(`Erro ao criar categoria: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza uma categoria existente
   * @param {number} id - ID da categoria
   * @param {object} categoria - Dados atualizados da categoria
   * @returns {Promise<boolean>} - true se sucesso
   */
  static async atualizar(id, categoria) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (categoria.nome !== undefined) {
        updates.push(`nome = $${paramIndex++}`);
        values.push(categoria.nome);
      }
      
      if (categoria.descricao !== undefined) {
        updates.push(`descricao = $${paramIndex++}`);
        values.push(categoria.descricao);
      }
      
      if (categoria.icone !== undefined) {
        updates.push(`icone = $${paramIndex++}`);
        values.push(categoria.icone);
      }
      
      if (updates.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }
      
      values.push(id);
      const query = {
        text: `UPDATE categorias SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values: values
      };
      
      const result = await db.query(query);
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Erro ao atualizar categoria: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove uma categoria pelo ID
   * @param {number} id - ID da categoria
   * @returns {Promise<boolean>} - true se removida com sucesso
   */
  static async remover(id) {
    try {
      // Verifica se existem serviços associados a esta categoria
      const servicosQuery = {
        text: 'SELECT COUNT(*) as total FROM servicos WHERE categoria_id = $1',
        values: [id]
      };
      const servicos = await db.query(servicosQuery);
      
      if (parseInt(servicos.rows[0].total) > 0) {
        throw new Error('Não é possível remover uma categoria que possui serviços associados');
      }
      
      const deleteQuery = {
        text: 'DELETE FROM categorias WHERE id = $1 RETURNING *',
        values: [id]
      };
      const result = await db.query(deleteQuery);
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Erro ao remover categoria: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Categoria;