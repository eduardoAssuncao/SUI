const { ApiError } = require('../middleware/errorHandler');
const Usuario = require('../models/usuario');
const logger = require('../utils/logger');

/**
 * Controlador para gerenciamento de usuários
 */
class UsuarioController {
  /**
   * Lista todos os usuários
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async listarTodos(req, res, next) {
    try {
      const usuarios = await Usuario.listarTodos();
      
      res.json({
        success: true,
        data: usuarios
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um usuário pelo ID
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      
      const usuario = await Usuario.buscarPorId(id);
      
      if (!usuario) {
        throw new ApiError('Usuário não encontrado', 404);
      }
      
      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria um novo usuário
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async criar(req, res, next) {
    try {
      const { nome, email, senha, cargo } = req.body;
      
      // Validação básica
      if (!nome || !email || !senha) {
        throw new ApiError('Nome, email e senha são obrigatórios', 400);
      }
      
      // Verifica se o email já está em uso
      const usuarioExistente = await Usuario.buscarPorEmail(email);
      
      if (usuarioExistente) {
        throw new ApiError('Email já está em uso', 400);
      }
      
      // Verifica o cargo (apenas administradores podem criar administradores)
      if (cargo === 'administrador' && req.user.cargo !== 'administrador') {
        throw new ApiError('Você não tem permissão para criar um administrador', 403);
      }
      
      // Cria o novo usuário
      const novoUsuario = await Usuario.criar({
        nome,
        email,
        senha,
        cargo: cargo || 'editor'
      });
      
      res.status(201).json({
        success: true,
        data: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          cargo: novoUsuario.cargo
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um usuário existente
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { nome, email, senha, cargo, ativo } = req.body;
      
      // Verifica se o usuário existe
      const usuario = await Usuario.buscarPorId(id);
      
      if (!usuario) {
        throw new ApiError('Usuário não encontrado', 404);
      }
      
      // Verifica permissões para atualizar outros usuários
      const usuarioLogado = req.user;
      
      // Se não for o próprio usuário ou um administrador
      if (parseInt(id) !== usuarioLogado.id && usuarioLogado.cargo !== 'administrador') {
        throw new ApiError('Você não tem permissão para atualizar este usuário', 403);
      }
      
      // Apenas administradores podem alterar cargos
      if (cargo && usuarioLogado.cargo !== 'administrador') {
        throw new ApiError('Você não tem permissão para alterar o cargo', 403);
      }
      
      // Apenas administradores podem ativar/desativar usuários
      if (ativo !== undefined && usuarioLogado.cargo !== 'administrador') {
        throw new ApiError('Você não tem permissão para ativar/desativar usuários', 403);
      }
      
      // Verifica se está tentando rebaixar o último administrador
      if (cargo && cargo !== 'administrador' && usuario.cargo === 'administrador') {
        const admins = await Usuario.listarTodos();
        const adminCount = admins.filter(u => u.cargo === 'administrador').length;
        
        if (adminCount <= 1) {
          throw new ApiError('Não é possível rebaixar o último administrador', 400);
        }
      }
      
      // Verifica se o novo email já está em uso
      if (email && email !== usuario.email) {
        const usuarioExistente = await Usuario.buscarPorEmail(email);
        
        if (usuarioExistente) {
          throw new ApiError('Email já está em uso', 400);
        }
      }
      
      // Atualiza o usuário
      await Usuario.atualizar(id, {
        nome,
        email,
        senha,
        cargo,
        ativo
      });
      
      // Busca o usuário atualizado
      const usuarioAtualizado = await Usuario.buscarPorId(id);
      
      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: usuarioAtualizado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove um usuário pelo ID
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async remover(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verifica se o usuário existe
      const usuario = await Usuario.buscarPorId(id);
      
      if (!usuario) {
        throw new ApiError('Usuário não encontrado', 404);
      }
      
      // Não permitir remover a si mesmo
      if (parseInt(id) === req.user.id) {
        throw new ApiError('Você não pode remover sua própria conta', 400);
      }
      
      // Verifica se é o último administrador
      if (usuario.cargo === 'administrador') {
        const admins = await Usuario.listarTodos();
        const adminCount = admins.filter(u => u.cargo === 'administrador').length;
        
        if (adminCount <= 1) {
          throw new ApiError('Não é possível remover o último administrador', 400);
        }
      }
      
      // Remove o usuário
      await Usuario.remover(id);
      
      res.json({
        success: true,
        message: 'Usuário removido com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UsuarioController;