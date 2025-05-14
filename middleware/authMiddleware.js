const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

/**
 * Middleware para autenticação de rotas usando JWT
 */
const authMiddleware = (req, res, next) => {
  try {
    // Verificar se o token foi fornecido no header de autorização
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Token de autenticação não fornecido', 401);
    }
    
    // Extrair o token do header
    const token = authHeader.split(' ')[1];
    
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    
    // Adicionar o usuário decodificado à requisição
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError('Token inválido', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError('Token expirado', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware para verificar permissões de usuário
 * @param {Array} roles - Array de cargos permitidos
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError('Acesso não autorizado', 401);
      }
      
      // Se roles não for fornecido, qualquer usuário autenticado pode acessar
      if (roles.length && !roles.includes(req.user.cargo)) {
        throw new ApiError('Permissão insuficiente para acessar este recurso', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authMiddleware,
  authorize
};