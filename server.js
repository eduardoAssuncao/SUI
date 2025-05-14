require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
// Importação das rotas
const authRoutes = require('./routes/authRoute');
const servicosRoutes = require('./routes/servicosRoute');
const categoriasRoutes = require('./routes/categoriasRoute');
const locaisRoutes = require('./routes/locaisRoute');
const faqRoutes = require('./routes/faqRoute');
// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware para logs de requisições HTTP
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
// Middleware para CORS e parse de JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/locais', locaisRoutes);
app.use('/api/faq', faqRoutes);
// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Serviços Públicos', 
    version: '1.0.0',
    status: 'online' 
  });
});
// Middleware para rotas não encontradas
app.use(notFoundHandler);
// Middleware para tratamento de erros
app.use(errorHandler);
// Iniciar o servidor
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
  console.log(`Servidor rodando na porta ${PORT}`);
});
// Exportar o app para testes
module.exports = app;