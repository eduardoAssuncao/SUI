const express = require('express');
const router = express.Router();
const Faq = require('../models/faq');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { ApiError } = require('../middleware/errorHandler');

// Listar FAQs por serviço (pública)
router.get('/servico/:servicoId', async (req, res, next) => {
  try {
    const perguntas = await Faq.listarPorServico(req.params.servicoId);
    res.json({ success: true, data: perguntas });
  } catch (error) {
    next(error);
  }
});

// Criar FAQ (protegida)
router.post(
  '/',
  authMiddleware,
  authorize(['editor', 'administrador']),
  async (req, res, next) => {
    try {
      const { servico_id, pergunta, resposta } = req.body;
      if (!servico_id || !pergunta || !resposta) {
        throw new ApiError('Serviço, pergunta e resposta são obrigatórios', 400);
      }
      const faq = await Faq.criar(req.body);
      res.status(201).json({ success: true, data: faq });
    } catch (error) {
      next(error);
    }
  }
);

// Atualizar FAQ (protegida)
router.put(
  '/:id',
  authMiddleware,
  authorize(['editor', 'administrador']),
  async (req, res, next) => {
    try {
      const sucesso = await Faq.atualizar(req.params.id, req.body);
      if (!sucesso) {
        throw new ApiError('Pergunta frequente não encontrada', 404);
      }
      res.json({ success: true, message: 'Pergunta atualizada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
);

// Remover FAQ (protegida)
router.delete(
  '/:id',
  authMiddleware,
  authorize(['administrador']),
  async (req, res, next) => {
    try {
      const sucesso = await Faq.remover(req.params.id);
      if (!sucesso) {
        throw new ApiError('Pergunta frequente não encontrada', 404);
      }
      res.json({ success: true, message: 'Pergunta removida com sucesso' });
    } catch (error) {
      next(error);
    }
  }
);

// Reordenar FAQs (protegida)
router.patch(
  '/reordenar/:servicoId',
  authMiddleware,
  authorize(['editor', 'administrador']),
  async (req, res, next) => {
    try {
      const { ordenacao } = req.body;
      if (!Array.isArray(ordenacao)) {
        throw new ApiError('Ordenação deve ser um array de IDs', 400);
      }
      await Faq.reordenar(req.params.servicoId, ordenacao);
      res.json({ success: true, message: 'Perguntas reordenadas com sucesso' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;