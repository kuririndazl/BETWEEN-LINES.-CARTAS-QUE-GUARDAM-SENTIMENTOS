const express = require('express');
const router = express.Router();
// O Router depende e importa o Controller para usar as funções de lógica
const authController = require('../controllers/authController');

// Rota GET: Formulário de Cadastro
router.get('/register', authController.getRegisterPage);

// Rota POST: Processamento do Cadastro
router.post('/register', authController.registerUser);

// Rota GET: Formulário de Login
router.get('/login', authController.getLoginPage);

// Rota POST: Processamento do Login
router.post('/login', authController.loginUser);

// Rota POST: Logout
router.post('/logout', authController.logoutUser);

module.exports = router;