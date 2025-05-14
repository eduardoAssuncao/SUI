const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const UsuarioController = require('../controllers/usuarioController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Rotas públicas
router.post('/login', AuthController.login);
router.post('/registrar', AuthController.registrar);

// Rotas protegidas
router.get('/verificar', authMiddleware, AuthController.verificarToken);
router.patch('/alterar-senha', authMiddleware, AuthController.alterarSenha);

// Gerenciamento de usuários (protegido)
router.get('/usuarios', authMiddleware, authorize(['administrador']), UsuarioController.listarTodos);
router.get('/usuarios/:id', authMiddleware, authorize(['administrador']), UsuarioController.buscarPorId);
router.post('/usuarios', authMiddleware, authorize(['administrador']), UsuarioController.criar);
router.put('/usuarios/:id', authMiddleware, authorize(['administrador']), UsuarioController.atualizar);
router.delete('/usuarios/:id', authMiddleware, authorize(['administrador']), UsuarioController.remover);

module.exports = router;