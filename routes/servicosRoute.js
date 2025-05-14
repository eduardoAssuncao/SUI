const express = require('express');
const router = express.Router();
const ServicoController = require('../controllers/servicoController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Rotas públicas
router.get('/', ServicoController.listarTodos);
router.get('/destaques', ServicoController.listarDestaques);
router.get('/:id', ServicoController.buscarPorId);

// Rotas protegidas (requer autenticação)
router.post(
  '/',
  authMiddleware,
  authorize(['editor', 'administrador']),
  ServicoController.criar
);
router.put(
  '/:id',
  authMiddleware,
  authorize(['editor', 'administrador']),
  ServicoController.atualizar
);
router.delete(
  '/:id',
  authMiddleware,
  authorize(['administrador']),
  ServicoController.remover
);
router.patch(
  '/:id/destaque',
  authMiddleware,
  authorize(['editor', 'administrador']),
  ServicoController.alterarDestaque
);

module.exports = router;