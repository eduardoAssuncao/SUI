const logger = require('../utils/logger');

/**
 * Middleware para tratamento de erros centralizados
 */
const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error(`${err.name}: ${err.message}\nStack: ${err.stack}`);
  
  // Obtém o status HTTP do erro ou define como 500 por padrão
  const statusCode = err.statusCode || 500;
  
  // Resposta de erro para o cliente
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Classe para erros específicos da API
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware para tratar rotas não encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(`Rota não encontrada: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  ApiError,
  notFoundHandler
};