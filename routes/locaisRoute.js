const express = require('express');
const router = express.Router();
const LocalAtendimento = require('../models/localAtendimento');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { ApiError } = require('../middleware/errorHandler');

// Listar locais por serviço (pública)
router.get('/servico/:servicoId', async (req, res, next) => {
  try {
    const locais = await LocalAtendimento.listarPorServico(req.params.servicoId);
    res.json({ success: true, data: locais });
  } catch (error) {
    next(error);
  }
});

// Criar local de atendimento (protegida)
router.post(
  '/',
  authMiddleware,
  authorize(['editor', 'administrador']),
  async (req, res, next) => {
    try {
      const { servico_id, nome, endereco } = req.body;
      if (!servico_id || !nome || !endereco) {
        throw new ApiError('Serviço, nome e endereço são obrigatórios', 400);
      }
      const local = await LocalAtendimento.criar(req.body);
      res.status(201).json({ success: true, data: local });
    } catch (error) {
      next(error);
    }
  }
);

// Atualizar local de atendimento (protegida)
router.put(
  '/:id',
  authMiddleware,
  authorize(['editor', 'administrador']),
  async (req, res, next) => {
    try {
      const sucesso = await LocalAtendimento.atualizar(req.params.id, req.body);
      if (!sucesso) {
        throw new ApiError('Local de atendimento não encontrado', 404);
      }
      res.json({ success: true, message: 'Local atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }
);

// Remover local de atendimento (protegida)
router.delete(
  '/:id',
  authMiddleware,
  authorize(['administrador']),
  async (req, res, next) => {
    try {
      const sucesso = await LocalAtendimento.remover(req.params.id);
      if (!sucesso) {
        throw new ApiError('Local de atendimento não encontrado', 404);
      }
      res.json({ success: true, message: 'Local removido com sucesso' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;