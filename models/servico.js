const db = require('../config/dataBaseConfig');
const logger = require('../utils/logger');

class Servico {
  /**
   * Busca um serviço pelo ID
   * @param {number} id - ID do serviço
   * @returns {Promise<object|null>} - Dados do serviço ou null se não encontrado
   */
  static async buscarPorId(id) {
    try {
      const query = `
        SELECT s.*, c.nome as categoria_nome, c.icone as categoria_icone
        FROM servicos s
        LEFT JOIN categorias c ON s.categoria_id = c.id
        WHERE s.id = ?
      `;
      const result = await db.query(query, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error(`Erro ao buscar serviço por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todos os serviços
   * @param {object} filtros - Filtros para a consulta
   * @returns {Promise<Array>} - Lista de serviços
   */
  static async listarTodos(filtros = {}) {
    try {
      let query = `
        SELECT s.*, c.nome as categoria_nome, c.icone as categoria_icone
        FROM servicos s
        LEFT JOIN categorias c ON s.categoria_id = c.id
        WHERE 1=1
      `;
      
      const params = [];
      
      // Filtragem por categoria
      if (filtros.categoria_id) {
        query += " AND s.categoria_id = ?";
        params.push(filtros.categoria_id);
      }
      
      // Filtragem por status (ativo)
      if (filtros.ativo !== undefined) {
        query += " AND s.ativo = ?";
        params.push(filtros.ativo);
      }
      
      // Filtragem por destaque
      if (filtros.destaque !== undefined) {
        query += " AND s.destaque = ?";
        params.push(filtros.destaque);
      }
      
      // Busca por texto
      if (filtros.busca) {
        query += " AND (s.nome LIKE ? OR s.descricao LIKE ?)";
        const termo = `%${filtros.busca}%`;
        params.push(termo, termo);
      }
      
      // Ordenação
      query += " ORDER BY s.destaque DESC, s.nome ASC";
      
      // Paginação
      if (filtros.limite) {
        query += " LIMIT ?";
        params.push(parseInt(filtros.limite));
        
        if (filtros.pagina) {
          const offset = (parseInt(filtros.pagina) - 1) * parseInt(filtros.limite);
          query += " OFFSET ?";
          params.push(offset);
        }
      }
      
      return await db.query(query, params);
    } catch (error) {
      logger.error(`Erro ao listar serviços: ${error.message}`);
      throw error;
    }
  }

  /**
   * Conta o total de serviços (para paginação)
   * @param {object} filtros - Filtros para a consulta
   * @returns {Promise<number>} - Total de serviços
   */
  static async contarTotal(filtros = {}) {
    try {
      let query = "SELECT COUNT(*) as total FROM servicos WHERE 1=1";
      const params = [];
      
      // Filtragem por categoria
      if (filtros.categoria_id) {
        query += " AND categoria_id = ?";
        params.push(filtros.categoria_id);
      }
      
      // Filtragem por status (ativo)
      if (filtros.ativo !== undefined) {
        query += " AND ativo = ?";
        params.push(filtros.ativo);
      }
      
      // Busca por texto
      if (filtros.busca) {
        query += " AND (nome LIKE ? OR descricao LIKE ?)";
        const termo = `%${filtros.busca}%`;
        params.push(termo, termo);
      }
      
      const result = await db.query(query, params);
      return result[0].total;
    } catch (error) {
      logger.error(`Erro ao contar total de serviços: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria um novo serviço
   * @param {object} servico - Dados do serviço
   * @param {number} usuarioId - ID do usuário que está criando
   * @returns {Promise<object>} - Serviço criado
   */
  static async criar(servico, usuarioId) {
    try {
      const result = await db.query(
        `INSERT INTO servicos 
         (nome, descricao, publico_alvo, como_acessar, documentacao_exigida, 
          link_agendamento, categoria_id, ativo, destaque, criado_por) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          servico.nome,
          servico.descricao,
          servico.publico_alvo,
          servico.como_acessar,
          servico.documentacao_exigida,
          servico.link_agendamento || null,
          servico.categoria_id || null,
          servico.ativo !== undefined ? servico.ativo : true,
          servico.destaque !== undefined ? servico.destaque : false,
          usuarioId
        ]
      );
      
      return { id: result.insertId, ...servico, criado_por: usuarioId };
    } catch (error) {
      logger.error(`Erro ao criar serviço: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza um serviço existente
   * @param {number} id - ID do serviço
   * @param {object} servico - Dados atualizados do serviço
   * @param {number} usuarioId - ID do usuário que está atualizando
   * @returns {Promise<boolean>} - true se sucesso
   */
  static async atualizar(id, servico, usuarioId) {
    try {
      let query = 'UPDATE servicos SET ';
      const params = [];
      
      // Constrói a query de atualização dinamicamente
      if (servico.nome !== undefined) {
        query += 'nome = ?, ';
        params.push(servico.nome);
      }
      
      if (servico.descricao !== undefined) {
        query += 'descricao = ?, ';
        params.push(servico.descricao);
      }
      
      if (servico.publico_alvo !== undefined) {
        query += 'publico_alvo = ?, ';
        params.push(servico.publico_alvo);
      }
      
      if (servico.como_acessar !== undefined) {
        query += 'como_acessar = ?, ';
        params.push(servico.como_acessar);
      }
      
      if (servico.documentacao_exigida !== undefined) {
        query += 'documentacao_exigida = ?, ';
        params.push(servico.documentacao_exigida);
      }
      
      if (servico.link_agendamento !== undefined) {
        query += 'link_agendamento = ?, ';
        params.push(servico.link_agendamento);
      }
      
      if (servico.categoria_id !== undefined) {
        query += 'categoria_id = ?, ';
        params.push(servico.categoria_id);
      }
      
      if (servico.ativo !== undefined) {
        query += 'ativo = ?, ';
        params.push(servico.ativo);
      }
      
      if (servico.destaque !== undefined) {
        query += 'destaque = ?, ';
        params.push(servico.destaque);
      }
      
      // Adiciona o usuário que está atualizando
      query += 'atualizado_por = ?, ';
      params.push(usuarioId);
      
      // Remove a vírgula e o espaço no final
      query = query.slice(0, -2);
      
      query += ' WHERE id = ?';
      params.push(id);
      
      const result = await db.query(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Erro ao atualizar serviço: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove um serviço pelo ID
   * @param {number} id - ID do serviço
   * @returns {Promise<boolean>} - true se removido com sucesso
   */
  static async remover(id) {
    try {
      const result = await db.query('DELETE FROM servicos WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Erro ao remover serviço: ${error.message}`);
      throw error;
    }
  }

  /**
   * Alterna o status de destaque de um serviço
   * @param {number} id - ID do serviço
   * @param {boolean} destaque - Novo status de destaque
   * @returns {Promise<boolean>} - true se atualizado com sucesso
   */
  static async alterarDestaque(id, destaque) {
    try {
      const result = await db.query(
        'UPDATE servicos SET destaque = ? WHERE id = ?',
        [destaque, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Erro ao alterar destaque do serviço: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca serviços em destaque
   * @param {number} limite - Limite de resultados
   * @returns {Promise<Array>} - Lista de serviços em destaque
   */
  static async buscarDestaques(limite = 6) {
    try {
      const query = `
        SELECT s.*, c.nome as categoria_nome, c.icone as categoria_icone
        FROM servicos s
        LEFT JOIN categorias c ON s.categoria_id = c.id
        WHERE s.destaque = true AND s.ativo = true
        ORDER BY s.nome
        LIMIT ?
      `;
      return await db.query(query, [limite]);
    } catch (error) {
      logger.error(`Erro ao buscar serviços em destaque: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Servico;