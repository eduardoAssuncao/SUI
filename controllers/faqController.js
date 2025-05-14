const Faq = require('../models/faq');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Controlador para gerenciamento de perguntas frequentes (FAQ)
 */
class FaqController {
  /**
   * Lista todas as perguntas frequentes de um serviço
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async listarPorServico(req, res, next) {
    try {
      const { servicoId } = req.params;
      const perguntas = await Faq.listarPorServico(servicoId);
      res.json({
        success: true,
        data: perguntas
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma pergunta frequente pelo ID
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      const pergunta = await Faq.buscarPorId(id);
      if (!pergunta) {
        throw new ApiError('Pergunta frequente não encontrada', 404);
      }
      res.json({
        success: true,
        data: pergunta
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria uma nova pergunta frequente
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async criar(req, res, next) {
    try {
      const { servico_id, pergunta, resposta } = req.body;
      if (!servico_id || !pergunta || !resposta) {
        throw new ApiError('Serviço, pergunta e resposta são obrigatórios', 400);
      }
      const novaPergunta = await Faq.criar({ servico_id, pergunta, resposta });
      res.status(201).json({
        success: true,
        data: novaPergunta
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma pergunta frequente existente
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { servico_id, pergunta, resposta, ordem } = req.body;
      const sucesso = await Faq.atualizar(id, { servico_id, pergunta, resposta, ordem });
      if (!sucesso) {
        throw new ApiError('Pergunta frequente não encontrada', 404);
      }
      const perguntaAtualizada = await Faq.buscarPorId(id);
      res.json({
        success: true,
        message: 'Pergunta frequente atualizada com sucesso',
        data: perguntaAtualizada
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove uma pergunta frequente pelo ID
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async remover(req, res, next) {
    try {
      const { id } = req.params;
      const sucesso = await Faq.remover(id);
      if (!sucesso) {
        throw new ApiError('Pergunta frequente não encontrada', 404);
      }
      res.json({
        success: true,
        message: 'Pergunta frequente removida com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reordena as perguntas frequentes de um serviço
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async reordenar(req, res, next) {
    try {
      const { servicoId } = req.params;
      const { ordenacao } = req.body;
      if (!Array.isArray(ordenacao)) {
        throw new ApiError('Ordenação deve ser um array de IDs', 400);
      }
      const sucesso = await Faq.reordenar(servicoId, ordenacao);
      if (!sucesso) {
        throw new ApiError('Erro ao reordenar perguntas frequentes', 400);
      }
      res.json({
        success: true,
        message: 'Perguntas frequentes reordenadas com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FaqController;