const winston = require('winston');
const path = require('path');

// Definição de níveis de log customizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Configuração de cores para diferentes níveis de log
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Adicionando cores ao Winston
winston.addColors(colors);

// Formato personalizado para os logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuração dos transportes para os logs
const transports = [
  // Console para logs de desenvolvimento
  new winston.transports.Console(),
  
  // Arquivo para todos os logs
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/all-logs.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Arquivo separado para logs de erro
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error-logs.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
];

// Criação da instância do logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports
});

module.exports = logger;