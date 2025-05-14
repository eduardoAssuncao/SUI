const express = require('express');
const router = express.Router();
const Categoria = require('../models/categoria');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { ApiError } = require('../middleware/errorHandler');
const convertBigInt = require('../utils/convertBigInt');


// Listar todas as categorias (pública)
router.get('/', async (req, res, next) => {
  try {
    const categorias = await Categoria.listarTodas();
    res.json({ success: true, data: convertBigInt(categorias) });
  } catch (error) {
    next(error);
  }
});

// Buscar categoria por ID (pública)
router.get('/:id', async (req, res, next) => {
  try {
    const categoria = await Categoria.buscarPorId(req.params.id);
    if (!categoria) {
      throw new ApiError('Categoria não encontrada', 404);
    }
    res.json({ success: true, data: convertBigInt(categoria) });
  } catch (error) {
    next(error);
  }
});

// Criar categoria (protegida)
router.post(
  '/',
  authMiddleware,
  authorize(['administrador']),
  async (req, res, next) => {
    try {
      const { nome, descricao, icone } = req.body;
      if (!nome) {
        throw new ApiError('Nome da categoria é obrigatório', 400);
      }
      const categoria = await Categoria.criar({ nome, descricao, icone });
      res.status(201).json({ success: true, data: convertBigInt(categoria) });
    } catch (error) {
      next(error);
    }
  }
);

// Atualizar categoria (protegida)
router.put(
  '/:id',
  authMiddleware,
  authorize(['administrador']),
  async (req, res, next) => {
    try {
      const { nome, descricao, icone } = req.body;
      const sucesso = await Categoria.atualizar(req.params.id, { nome, descricao, icone });
      if (!sucesso) {
        throw new ApiError('Categoria não encontrada', 404);
      }
      res.json({ success: true, message: 'Categoria atualizada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
);

// Remover categoria (protegida)
router.delete(
  '/:id',
  authMiddleware,
  authorize(['administrador']),
  async (req, res, next) => {
    try {
      const sucesso = await Categoria.remover(req.params.id);
      if (!sucesso) {
        throw new ApiError('Categoria não encontrada ou possui serviços associados', 400);
      }
      res.json({ success: true, message: 'Categoria removida com sucesso' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;