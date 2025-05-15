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
      const { rows } = await db.query(
        'SELECT id, nome, email, cargo, ativo FROM usuarios WHERE id = $1', 
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
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
      const { rows } = await db.query(
        'SELECT * FROM usuarios WHERE email = $1', 
        [email]
      );
      return rows.length > 0 ? rows[0] : null;
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
      
      const { rows } = await db.query(
        'INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo, ativo',
        [usuario.nome, usuario.email, senhaHash, usuario.cargo || 'editor']
      );
      
      return rows[0];
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
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      // Constrói a query de atualização dinamicamente
      if (usuario.nome) {
        updates.push(`nome = $${paramCount++}`);
        values.push(usuario.nome);
      }
      
      if (usuario.email) {
        updates.push(`email = $${paramCount++}`);
        values.push(usuario.email);
      }
      
      if (usuario.senha) {
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(usuario.senha, saltRounds);
        updates.push(`senha = $${paramCount++}`);
        values.push(senhaHash);
      }
      
      if (usuario.cargo) {
        updates.push(`cargo = $${paramCount++}`);
        values.push(usuario.cargo);
      }
      
      if (usuario.ativo !== undefined) {
        updates.push(`ativo = $${paramCount++}`);
        values.push(usuario.ativo);
      }
      
      if (updates.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }
      
      values.push(id);
      const query = `
        UPDATE usuarios 
        SET ${updates.join(', ')}, data_atualizacao = NOW() 
        WHERE id = $${paramCount}
        RETURNING id, nome, email, cargo, ativo
      `;
      
      const { rowCount } = await db.query(query, values);
      return rowCount > 0;
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
      const { rows } = await db.query(
        'SELECT id, nome, email, cargo, ativo, data_criacao, data_atualizacao FROM usuarios ORDER BY nome'
      );
      return rows;
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
      const { rowCount } = await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
      return rowCount > 0;
    } catch (error) {
      logger.error(`Erro ao remover usuário: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Usuario;