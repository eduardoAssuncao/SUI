const db = require('../config/dataBaseConfig');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

class Usuario {
  /**
   * Busca um usuário pelo ID
   * @param {number} id - ID do usuário
   * @returns {Promise<object|null>} - Dados do usuário ou null se não encontrado
   */
  static async buscarPorId(id) {
    try {
      const result = await db.query('SELECT id, nome, email, cargo, ativo FROM usuarios WHERE id = ?', [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error(`Erro ao buscar usuário por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca um usuário pelo email
   * @param {string} email - Email do usuário
   * @returns {Promise<object|null>} - Dados do usuário ou null se não encontrado
   */
  static async buscarPorEmail(email) {
    try {
      const result = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error(`Erro ao buscar usuário por email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria um novo usuário
   * @param {object} usuario - Dados do usuário
   * @returns {Promise<object>} - Usuário criado
   */
  static async criar(usuario) {
    try {
      // Hash da senha com bcrypt
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(usuario.senha, saltRounds);
      
      const result = await db.query(
        'INSERT INTO usuarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)',
        [usuario.nome, usuario.email, senhaHash, usuario.cargo || 'editor']
      );
      
      return {
        id: result.insertId,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo || 'editor'
      };
    } catch (error) {
      logger.error(`Erro ao criar usuário: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza um usuário existente
   * @param {number} id - ID do usuário
   * @param {object} usuario - Dados atualizados do usuário
   * @returns {Promise<boolean>} - true se sucesso
   */
  static async atualizar(id, usuario) {
    try {
      let query = 'UPDATE usuarios SET ';
      const params = [];
      
      // Constrói a query de atualização dinamicamente
      if (usuario.nome) {
        query += 'nome = ?, ';
        params.push(usuario.nome);
      }
      
      if (usuario.email) {
        query += 'email = ?, ';
        params.push(usuario.email);
      }
      
      if (usuario.senha) {
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(usuario.senha, saltRounds);
        query += 'senha = ?, ';
        params.push(senhaHash);
      }
      
      if (usuario.cargo) {
        query += 'cargo = ?, ';
        params.push(usuario.cargo);
      }
      
      if (usuario.ativo !== undefined) {
        query += 'ativo = ?, ';
        params.push(usuario.ativo);
      }
      
      // Remove a vírgula e o espaço no final
      query = query.slice(0, -2);
      
      query += ' WHERE id = ?';
      params.push(id);
      
      const result = await db.query(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Erro ao atualizar usuário: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica se a senha está correta
   * @param {string} senha - Senha em texto puro
   * @param {string} hashSenha - Hash da senha armazenada
   * @returns {Promise<boolean>} - true se a senha estiver correta
   */
  static async verificarSenha(senha, hashSenha) {
    try {
      return await bcrypt.compare(senha, hashSenha);
    } catch (error) {
      logger.error(`Erro ao verificar senha: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todos os usuários
   * @returns {Promise<Array>} - Lista de usuários
   */
  static async listarTodos() {
    try {
      return await db.query(
        'SELECT id, nome, email, cargo, ativo, data_criacao, data_atualizacao FROM usuarios'
      );
    } catch (error) {
      logger.error(`Erro ao listar usuários: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove um usuário pelo ID
   * @param {number} id - ID do usuário
   * @returns {Promise<boolean>} - true se removido com sucesso
   */
  static async remover(id) {
    try {
      const result = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Erro ao remover usuário: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Usuario;