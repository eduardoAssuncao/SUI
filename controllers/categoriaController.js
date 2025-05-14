const Categoria = require('../models/categoria');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const convertBigInt = require('../utils/convertBigInt');

/**
 * Controlador para gerenciamento de categorias
 */
class CategoriaController {
  /**
   * Lista todas as categorias
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async listarTodos(req, res, next) {
    try {
      const categorias = await Categoria.listarTodas();
      res.json({
        success: true,
        data: convertBigInt(categorias)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma categoria pelo ID
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.buscarPorId(id);
      if (!categoria) {
        throw new ApiError('Categoria não encontrada', 404);
      }
      res.json({
        success: true,
        data: convertBigInt(categoria)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria uma nova categoria
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async criar(req, res, next) {
    try {
      const { nome, descricao, icone } = req.body;
      if (!nome) {
        throw new ApiError('Nome da categoria é obrigatório', 400);
      }
      const novaCategoria = await Categoria.criar({ nome, descricao, icone });
      res.status(201).json({
        success: true,
        data: convertBigInt(novaCategoria)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma categoria existente
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { nome, descricao, icone } = req.body;
      const sucesso = await Categoria.atualizar(id, { nome, descricao, icone });
      if (!sucesso) {
        throw new ApiError('Categoria não encontrada', 404);
      }
      const categoriaAtualizada = await Categoria.buscarPorId(id);
      res.json({
        success: true,
        message: 'Categoria atualizada com sucesso',
        data: convertBigInt(categoriaAtualizada)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove uma categoria pelo ID
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async remover(req, res, next) {
    try {
      const { id } = req.params;
      const sucesso = await Categoria.remover(id);
      if (!sucesso) {
        throw new ApiError('Categoria não encontrada ou possui serviços associados', 400);
      }
      res.json({
        success: true,
        message: 'Categoria removida com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoriaController;