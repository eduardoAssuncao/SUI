const Servico = require('../models/servico');
const LocalAtendimento = require('../models/localAtendimento');
const Faq = require('../models/faq');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ServicoService {
  /**
   * Lista todos os serviços com filtros e paginação
   * @param {object} filtros - Filtros para a consulta
   * @returns {Promise<object>} - Serviços e metadados
   */
  static async listarTodos(filtros) {
    try {
      const [servicos, total] = await Promise.all([
        Servico.listarTodos(filtros),
        Servico.contarTotal(filtros)
      ]);

      return {
        servicos,
        meta: {
          total,
          pagina: filtros.pagina || 1,
          limite: filtros.limite || 10,
          total_paginas: Math.ceil(total / (filtros.limite || 10))
        }
      };
    } catch (error) {
      logger.error(`Erro no serviço de listagem de serviços: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca serviços em destaque
   * @param {number} limite - Limite de serviços
   * @returns {Promise<Array>} - Lista de serviços em destaque
   */
  static async buscarDestaques(limite) {
    try {
      return await Servico.buscarDestaques(limite);
    } catch (error) {
      logger.error(`Erro no serviço de busca de destaques: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca um serviço completo pelo ID
   * @param {number} id - ID do serviço
   * @returns {Promise<object>} - Serviço com informações relacionadas
   */
  static async buscarPorId(id) {
    try {
      const [servico, locais, perguntas] = await Promise.all([
        Servico.buscarPorId(id),
        LocalAtendimento.listarPorServico(id),
        Faq.listarPorServico(id)
      ]);

      if (!servico) {
        throw new ApiError('Serviço não encontrado', 404);
      }

      return {
        ...servico,
        locais_atendimento: locais,
        perguntas_frequentes: perguntas
      };
    } catch (error) {
      logger.error(`Erro no serviço de busca por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria um novo serviço com informações relacionadas
   * @param {object} dados - Dados do serviço
   * @param {number} usuarioId - ID do usuário criador
   * @returns {Promise<object>} - Serviço criado
   */
  static async criar(dados, usuarioId) {
    const conn = await require('../config/dataBaseConfig').getConnection();
    try {
      await conn.beginTransaction();

      // Validações
      if (!dados.nome || !dados.descricao || !dados.publico_alvo || !dados.como_acessar || !dados.documentacao_exigida) {
        throw new ApiError('Campos obrigatórios não fornecidos', 400);
      }

      // Cria o serviço
      const servico = await Servico.criar(dados, usuarioId);

      // Cria locais de atendimento
      if (dados.locais_atendimento && Array.isArray(dados.locais_atendimento)) {
        for (const local of dados.locais_atendimento) {
          await LocalAtendimento.criar({ ...local, servico_id: servico.id });
        }
      }

      // Cria perguntas frequentes
      if (dados.perguntas_frequentes && Array.isArray(dados.perguntas_frequentes)) {
        for (const pergunta of dados.perguntas_frequentes) {
          await Faq.criar({ ...pergunta, servico_id: servico.id });
        }
      }

      await conn.commit();
      return await this.buscarPorId(servico.id);
    } catch (error) {
      await conn.rollback();
      logger.error(`Erro no serviço de criação de serviço: ${error.message}`);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Atualiza um serviço existente
   * @param {number} id - ID do serviço
   * @param {object} dados - Dados atualizados
   * @param {number} usuarioId - ID do usuário atualizador
   * @returns {Promise<object>} - Serviço atualizado
   */
  static async atualizar(id, dados, usuarioId) {
    const conn = await require('../config/dataBaseConfig').getConnection();
    try {
      await conn.beginTransaction();

      const servicoExistente = await Servico.buscarPorId(id);
      if (!servicoExistente) {
        throw new ApiError('Serviço não encontrado', 404);
      }

      await Servico.atualizar(id, dados, usuarioId);

      if (dados.locais_atendimento && Array.isArray(dados.locais_atendimento)) {
        await LocalAtendimento.removerPorServico(id);
        for (const local of dados.locais_atendimento) {
          await LocalAtendimento.criar({ ...local, servico_id: id });
        }
      }

      if (dados.perguntas_frequentes && Array.isArray(dados.perguntas_frequentes)) {
        await Faq.removerPorServico(id);
        for (const pergunta of dados.perguntas_frequentes) {
          await Faq.criar({ ...pergunta, servico_id: id });
        }
      }

      await conn.commit();
      return await this.buscarPorId(id);
    } catch (error) {
      await conn.rollback();
      logger.error(`Erro no serviço de atualização de serviço: ${error.message}`);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Remove um serviço
   * @param {number} id - ID do serviço
   * @returns {Promise<boolean>} - true se removido
   */
  static async remover(id) {
    const conn = await require('../config/dataBaseConfig').getConnection();
    try {
      await conn.beginTransaction();

      const servico = await Servico.buscarPorId(id);
      if (!servico) {
        throw new ApiError('Serviço não encontrado', 404);
      }

      await Promise.all([
        LocalAtendimento.removerPorServico(id),
        Faq.removerPorServico(id)
      ]);

      await Servico.remover(id);
      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      logger.error(`Erro no serviço de remoção de serviço: ${error.message}`);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Altera o status de destaque
   * @param {number} id - ID do serviço
   * @param {boolean} destaque - Novo status
   * @returns {Promise<boolean>} - true se alterado
   */
  static async alterarDestaque(id, destaque) {
    try {
      const servico = await Servico.buscarPorId(id);
      if (!servico) {
        throw new ApiError('Serviço não encontrado', 404);
      }
      return await Servico.alterarDestaque(id, destaque);
    } catch (error) {
      logger.error(`Erro no serviço de alteração de destaque: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ServicoService;