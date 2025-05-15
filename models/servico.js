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
        WHERE s.id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
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
      let paramCount = 1;
      
      // Filtragem por categoria
      if (filtros.categoria_id) {
        query += ` AND s.categoria_id = $${paramCount++}`;
        params.push(filtros.categoria_id);
      }
      
      // Filtragem por status (ativo)
      if (filtros.ativo !== undefined) {
        query += ` AND s.ativo = $${paramCount++}`;
        params.push(filtros.ativo);
      }
      
      // Filtragem por destaque
      if (filtros.destaque !== undefined) {
        query += ` AND s.destaque = $${paramCount++}`;
        params.push(filtros.destaque);
      }
      
      // Busca por texto
      if (filtros.busca) {
        const termo = `%${filtros.busca}%`;
        query += ` AND (s.nome ILIKE $${paramCount++} OR s.descricao ILIKE $${paramCount++})`;
        params.push(termo, termo);
      }
      
      // Ordenação
      query += " ORDER BY s.destaque DESC, s.nome ASC";
      
      // Paginação
      if (filtros.limite) {
        query += ` LIMIT $${paramCount++}`;
        params.push(parseInt(filtros.limite));
        
        if (filtros.pagina) {
          const offset = (parseInt(filtros.pagina) - 1) * parseInt(filtros.limite);
          query += ` OFFSET $${paramCount++}`;
          params.push(offset);
        }
      }
      
      const result = await db.query(query, params);
      return result.rows;
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
      let paramCount = 1;
      
      // Filtragem por categoria
      if (filtros.categoria_id) {
        query += ` AND categoria_id = $${paramCount++}`;
        params.push(filtros.categoria_id);
      }
      
      // Filtragem por status (ativo)
      if (filtros.ativo !== undefined) {
        query += ` AND ativo = $${paramCount++}`;
        params.push(filtros.ativo);
      }
      
      // Busca por texto
      if (filtros.busca) {
        const termo = `%${filtros.busca}%`;
        query += ` AND (nome ILIKE $${paramCount++} OR descricao ILIKE $${paramCount++})`;
        params.push(termo, termo);
      }
      
      const result = await db.query(query, params);
      return result.rows[0].total;
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
      const query = `
        INSERT INTO servicos 
        (nome, descricao, publico_alvo, como_acessar, documentacao_exigida, 
         link_agendamento, categoria_id, ativo, destaque, criado_por) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
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
      ];
      
      const result = await db.query(query, values);
      return { ...result.rows[0], criado_por: usuarioId };
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
      const setClauses = [];
      
      if (servico.nome !== undefined) {
        setClauses.push(`nome = $${params.length + 1}`);
        params.push(servico.nome);
      }
      
      if (servico.descricao !== undefined) {
        setClauses.push(`descricao = $${params.length + 1}`);
        params.push(servico.descricao);
      }
      
      if (servico.publico_alvo !== undefined) {
        setClauses.push(`publico_alvo = $${params.length + 1}`);
        params.push(servico.publico_alvo);
      }
      
      if (servico.como_acessar !== undefined) {
        setClauses.push(`como_acessar = $${params.length + 1}`);
        params.push(servico.como_acessar);
      }
      
      if (servico.documentacao_exigida !== undefined) {
        setClauses.push(`documentacao_exigida = $${params.length + 1}`);
        params.push(servico.documentacao_exigida);
      }
      
      if (servico.link_agendamento !== undefined) {
        setClauses.push(`link_agendamento = $${params.length + 1}`);
        params.push(servico.link_agendamento);
      }
      
      if (servico.categoria_id !== undefined) {
        setClauses.push(`categoria_id = $${params.length + 1}`);
        params.push(servico.categoria_id);
      }
      
      if (servico.ativo !== undefined) {
        setClauses.push(`ativo = $${params.length + 1}`);
        params.push(servico.ativo);
      }
      
      if (servico.destaque !== undefined) {
        setClauses.push(`destaque = $${params.length + 1}`);
        params.push(servico.destaque);
      }
      
      // Adiciona o usuário que está atualizando
      setClauses.push(`atualizado_por = $${params.length + 1}`);
      params.push(usuarioId);
      
      // Adiciona a cláusula SET
      query += setClauses.join(', ');
      
      // Adiciona a condição WHERE
      query += ` WHERE id = $${params.length + 1}`;
      params.push(id);
      
      const result = await db.query(query, params);
      return result.rowCount > 0;
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
      const result = await db.query('DELETE FROM servicos WHERE id = $1', [id]);
      return result.rowCount > 0;
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
        'UPDATE servicos SET destaque = $1 WHERE id = $2',
        [destaque, id]
      );
      return result.rowCount > 0;
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
        LIMIT $1
      `;
      const result = await db.query(query, [limite]);
      return result.rows;
    } catch (error) {
      logger.error(`Erro ao buscar serviços em destaque: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Servico;