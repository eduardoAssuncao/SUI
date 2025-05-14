const LocalAtendimento = require('../models/localAtendimento');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Controlador para gerenciamento de locais de atendimento
 */
class LocalAtendimentoController {
  /**
   * Lista todos os locais de atendimento de um serviço
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async listarPorServico(req, res, next) {
    try {
      const { servicoId } = req.params;
      const locais = await LocalAtendimento.listarPorServico(servicoId);
      res.json({
        success: true,
        data: locais
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um local de atendimento pelo ID
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      const local = await LocalAtendimento.buscarPorId(id);
      if (!local) {
        throw new ApiError('Local de atendimento não encontrado', 404);
      }
      res.json({
        success: true,
        data: local
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria um novo local de atendimento
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async criar(req, res, next) {
    try {
      const { servico_id, nome, endereco, cep, telefone, horario_funcionamento, latitude, longitude } = req.body;
      if (!servico_id || !nome || !endereco) {
        throw new ApiError('Serviço, nome e endereço são obrigatórios', 400);
      }
      const novoLocal = await LocalAtendimento.criar({
        servico_id,
        nome,
        endereco,
        cep,
        telefone,
        horario_funcionamento,
        latitude,
        longitude
      });
      res.status(201).json({
        success: true,
        data: novoLocal
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um local de atendimento existente
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { servico_id, nome, endereco, cep, telefone, horario_funcionamento, latitude, longitude } = req.body;
      const sucesso = await LocalAtendimento.atualizar(id, {
        servico_id,
        nome,
        endereco,
        cep,
        telefone,
        horario_funcionamento,
        latitude,
        longitude
      });
      if (!sucesso) {
        throw new ApiError('Local de atendimento não encontrado', 404);
      }
      const localAtualizado = await LocalAtendimento.buscarPorId(id);
      res.json({
        success: true,
        message: 'Local de atendimento atualizado com sucesso',
        data: localAtualizado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove um local de atendimento pelo ID
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async remover(req, res, next) {
    try {
      const { id } = req.params;
      const sucesso = await LocalAtendimento.remover(id);
      if (!sucesso) {
        throw new ApiError('Local de atendimento não encontrado', 404);
      }
      res.json({
        success: true,
        message: 'Local de atendimento removido com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LocalAtendimentoController;