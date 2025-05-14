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
      const result = await db.query('SELECT * FROM categorias WHERE id = ?', [id]);
      return result.length > 0 ? result[0] : null;
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
      const query = `
        SELECT c.*, COUNT(s.id) as total_servicos
        FROM categorias c
        LEFT JOIN servicos s ON c.id = s.categoria_id AND s.ativo = true
        GROUP BY c.id
        ORDER BY c.nome
      `;
      return await db.query(query);
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
      const result = await db.query(
        'INSERT INTO categorias (nome, descricao, icone) VALUES (?, ?, ?)',
        [categoria.nome, categoria.descricao || null, categoria.icone || null]
      );
      
      return { id: result.insertId, ...categoria };
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
      let query = 'UPDATE categorias SET ';
      const params = [];
      
      // Constrói a query de atualização dinamicamente
      if (categoria.nome !== undefined) {
        query += 'nome = ?, ';
        params.push(categoria.nome);
      }
      
      if (categoria.descricao !== undefined) {
        query += 'descricao = ?, ';
        params.push(categoria.descricao);
      }
      
      if (categoria.icone !== undefined) {
        query += 'icone = ?, ';
        params.push(categoria.icone);
      }
      
      // Remove a vírgula e o espaço no final
      query = query.slice(0, -2);
      
      query += ' WHERE id = ?';
      params.push(id);
      
      const result = await db.query(query, params);
      return result.affectedRows > 0;
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
      const servicos = await db.query('SELECT COUNT(*) as total FROM servicos WHERE categoria_id = ?', [id]);
      
      if (servicos[0].total > 0) {
        throw new Error('Não é possível remover uma categoria que possui serviços associados');
      }
      
      const result = await db.query('DELETE FROM categorias WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Erro ao remover categoria: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Categoria;