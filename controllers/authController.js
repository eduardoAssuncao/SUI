const jwt = require('jsonwebtoken');
const { ApiError } = require('../middleware/errorHandler');
const Usuario = require('../models/usuario');
const logger = require('../utils/logger');
const convertBigInt = require('../utils/convertBigInt');

/**
 * Controlador para autenticação de usuários
 */
class AuthController {
  /**
   * Realiza login do usuário
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      
      // Validação básica
      if (!email || !senha) {
        throw new ApiError('Email e senha são obrigatórios', 400);
      }
      
      // Busca o usuário pelo email
      const usuario = await Usuario.buscarPorEmail(email);
      
      // Verifica se o usuário existe
      if (!usuario) {
        throw new ApiError('Credenciais inválidas', 401);
      }
      
      // Verifica se o usuário está ativo
      if (!usuario.ativo) {
        throw new ApiError('Usuário inativo', 403);
      }
      
      // Verifica se a senha está correta
      const senhaCorreta = await Usuario.verificarSenha(senha, usuario.senha);
      
      if (!senhaCorreta) {
        throw new ApiError('Credenciais inválidas', 401);
      }
      
      // Gera o token JWT
      const token = jwt.sign(
        { 
          id: usuario.id, 
          nome: usuario.nome, 
          email: usuario.email,
          cargo: usuario.cargo 
        },
        process.env.JWT_SECRET || 'sua_chave_secreta',
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          cargo: usuario.cargo
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifica o token JWT e retorna os dados do usuário autenticado
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async verificarToken(req, res, next) {
    try {
      // O middleware authMiddleware já verificou o token
      // e adicionou os dados do usuário em req.user
      
      // Busca os dados atualizados do usuário
      const usuario = await Usuario.buscarPorId(req.user.id);
      
      if (!usuario) {
        throw new ApiError('Usuário não encontrado', 404);
      }
      
      if (!usuario.ativo) {
        throw new ApiError('Usuário inativo', 403);
      }
      
      res.json({
        success: true,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          cargo: usuario.cargo
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registra um novo usuário (apenas administradores podem criar usuários)
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async registrar(req, res, next) {
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
      
      // Cria o novo usuário
      const novoUsuario = await Usuario.criar({
        nome,
        email,
        senha,
        cargo: cargo || 'editor'
      });
      
      res.status(201).json({
        success: true,
        usuario: {
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
   * Atualiza a senha do usuário autenticado
   * @param {object} req - Objeto de requisição
   * @param {object} res - Objeto de resposta
   * @param {function} next - Próxima função middleware
   */
  static async alterarSenha(req, res, next) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      const usuarioId = req.user.id;
      
      // Validação básica
      if (!senhaAtual || !novaSenha) {
        throw new ApiError('Senha atual e nova senha são obrigatórias', 400);
      }
      
      // Busca o usuário pelo ID
      const usuario = await Usuario.buscarPorEmail(req.user.email);
      
      if (!usuario) {
        throw new ApiError('Usuário não encontrado', 404);
      }
      
      // Verifica se a senha atual está correta
      const senhaCorreta = await Usuario.verificarSenha(senhaAtual, usuario.senha);
      
      if (!senhaCorreta) {
        throw new ApiError('Senha atual incorreta', 401);
      }
      
      // Atualiza a senha
      await Usuario.atualizar(usuarioId, { senha: novaSenha });
      
      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;