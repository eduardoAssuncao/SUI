const { ApiError } = require('../middleware/errorHandler');
const Servico = require('../models/servico');
const LocalAtendimento = require('../models/localAtendimento');
const Faq = require('../models/faq');
const logger = require('../utils/logger');

/**
 * Controlador para gerenciamento de serviços
 */
class ServicoController {
  /**
   * Lista todos os serviços com filtros e paginação
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async listarTodos(req, res, next) {
    try {
      // Extrai os parâmetros de consulta
      const { 
        categoria_id, 
        ativo, 
        destaque, 
        busca,
        pagina = 1,
        limite = 10
      } = req.query;
      
      // Prepara os filtros
      const filtros = {
        categoria_id: categoria_id ? parseInt(categoria_id) : undefined,
        ativo: ativo === 'true' ? true : (ativo === 'false' ? false : undefined),
        destaque: destaque === 'true' ? true : (destaque === 'false' ? false : undefined),
        busca,
        pagina: parseInt(pagina),
        limite: parseInt(limite)
      };
      
      // Obtém os serviços e o total
      const [servicos, total] = await Promise.all([
        Servico.listarTodos(filtros),
        Servico.contarTotal(filtros)
      ]);
      
      // Calcula informações de paginação
      const totalBigInt = BigInt(total);
      const limiteBigInt = BigInt(filtros.limite);
      const totalPaginas = (totalBigInt + limiteBigInt - 1n) / limiteBigInt;
      
      res.json({
        success: true,
        data: servicos,
        meta: {
          total: Number(totalBigInt),
          pagina: filtros.pagina,
          limite: filtros.limite,
          total_paginas: Number(totalPaginas)
        }
      });
      
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista serviços em destaque
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async listarDestaques(req, res, next) {
    try {
      const { limite = 6 } = req.query;
      
      const destaques = await Servico.buscarDestaques(parseInt(limite));
      
      res.json({
        success: true,
        data: destaques
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um serviço pelo ID com suas informações relacionadas
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      
      // Busca o serviço e suas informações relacionadas
      const [servico, locais, perguntas] = await Promise.all([
        Servico.buscarPorId(id),
        LocalAtendimento.listarPorServico(id),
        Faq.listarPorServico(id)
      ]);
      
      if (!servico) {
        throw new ApiError('Serviço não encontrado', 404);
      }
      
      // Adiciona as informações relacionadas ao serviço
      servico.locais_atendimento = locais;
      servico.perguntas_frequentes = perguntas;
      
      res.json({
        success: true,
        data: servico
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria um novo serviço com suas informações relacionadas
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async criar(req, res, next) {
    try {
      const { 
        nome, 
        descricao, 
        publico_alvo, 
        como_acessar, 
        documentacao_exigida, 
        link_agendamento, 
        categoria_id, 
        ativo,
        destaque,
        locais_atendimento,
        perguntas_frequentes
      } = req.body;
      
      // Validação básica
      if (!nome || !descricao || !publico_alvo || !como_acessar || !documentacao_exigida) {
        throw new ApiError('Campos obrigatórios não fornecidos', 400);
      }
      
      const db = require('../config/dataBaseConfig');
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Cria o serviço
        const servico = await Servico.criar({
          nome,
          descricao,
          publico_alvo,
          como_acessar,
          documentacao_exigida,
          link_agendamento,
          categoria_id,
          ativo,
          destaque
        }, req.user.id);
        
        // Cria os locais de atendimento
        if (locais_atendimento && Array.isArray(locais_atendimento) && locais_atendimento.length > 0) {
          for (const local of locais_atendimento) {
            await LocalAtendimento.criar({
              ...local,
              servico_id: servico.id
            });
          }
        }
        
        // Cria as perguntas frequentes
        if (perguntas_frequentes && Array.isArray(perguntas_frequentes) && perguntas_frequentes.length > 0) {
          for (const pergunta of perguntas_frequentes) {
            await Faq.criar({
              ...pergunta,
              servico_id: servico.id
            });
          }
        }
        
        await client.query('COMMIT');
        
        // Busca o serviço completo para retornar
        const servicoCompleto = await ServicoController.buscarServicoPorId(servico.id);
        
        res.status(201).json({
          success: true,
          message: 'Serviço criado com sucesso',
          data: servicoCompleto
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um serviço existente e suas informações relacionadas
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        nome, 
        descricao, 
        publico_alvo, 
        como_acessar, 
        documentacao_exigida, 
        link_agendamento, 
        categoria_id, 
        ativo,
        destaque,
        locais_atendimento,
        perguntas_frequentes
      } = req.body;
      
      // Verifica se o serviço existe
      const servicoExistente = await Servico.buscarPorId(id);
      
      if (!servicoExistente) {
        throw new ApiError('Serviço não encontrado', 404);
      }
      
      const db = require('../config/dataBaseConfig');
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Atualiza o serviço
        await Servico.atualizar(id, {
          nome,
          descricao,
          publico_alvo,
          como_acessar,
          documentacao_exigida,
          link_agendamento,
          categoria_id,
          ativo,
          destaque
        }, req.user.id);
        
        // Atualiza os locais de atendimento (remove e recria)
        if (locais_atendimento && Array.isArray(locais_atendimento)) {
          // Remove os locais existentes
          await LocalAtendimento.removerPorServico(id);
          
          // Cria os novos locais
          for (const local of locais_atendimento) {
            await LocalAtendimento.criar({
              ...local,
              servico_id: id
            });
          }
        }
        
        // Atualiza as perguntas frequentes (remove e recria)
        if (perguntas_frequentes && Array.isArray(perguntas_frequentes)) {
          // Remove as perguntas existentes
          await Faq.removerPorServico(id);
          
          // Cria as novas perguntas
          for (const pergunta of perguntas_frequentes) {
            await Faq.criar({
              ...pergunta,
              servico_id: id
            });
          }
        }
        
        await client.query('COMMIT');
        
        // Busca o serviço completo para retornar
        const servicoAtualizado = await ServicoController.buscarServicoPorId(id);
        
        res.json({
          success: true,
          message: 'Serviço atualizado com sucesso',
          data: servicoAtualizado
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove um serviço pelo ID
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async remover(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verifica se o serviço existe
      const servico = await Servico.buscarPorId(id);
      
      if (!servico) {
        throw new ApiError('Serviço não encontrado', 404);
      }
      
      const db = require('../config/dataBaseConfig');
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Remove os locais de atendimento e perguntas frequentes
        await Promise.all([
          LocalAtendimento.removerPorServico(id),
          Faq.removerPorServico(id)
        ]);
        
        // Remove o serviço
        await Servico.remover(id);
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Serviço removido com sucesso'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Altera o status de destaque de um serviço
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async alterarDestaque(req, res, next) {
    try {
      const { id } = req.params;
      const { destaque } = req.body;
      
      // Verifica se o serviço existe
      const servico = await Servico.buscarPorId(id);
      
      if (!servico) {
        throw new ApiError('Serviço não encontrado', 404);
      }
      
      // Altera o destaque
      await Servico.alterarDestaque(id, destaque);
      
      res.json({
        success: true,
        message: `Serviço ${destaque ? 'destacado' : 'removido dos destaques'} com sucesso`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Método auxiliar para buscar um serviço completo pelo ID
   * @param {number} id - ID do serviço
   * @returns {Promise<object>} - Serviço completo com informações relacionadas
   */
  static async buscarServicoPorId(id) {
    const [servico, locais, perguntas] = await Promise.all([
      Servico.buscarPorId(id),
      LocalAtendimento.listarPorServico(id),
      Faq.listarPorServico(id)
    ]);
    
    servico.locais_atendimento = locais;
    servico.perguntas_frequentes = perguntas;
    
    return servico;
  }
}

module.exports = ServicoController;