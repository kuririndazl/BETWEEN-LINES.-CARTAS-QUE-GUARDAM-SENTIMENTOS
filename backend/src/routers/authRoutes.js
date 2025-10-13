const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota da página de cadastro
router.get('/register', authController.getRegisterPage);

// Rota para processamento do cadastro (POST)
router.post('/register', authController.registerUser);

// Rota para o Login (GET)
router.get('/login', authController.getLoginPage);

// Rota para processar login (POST)
router.post('/login', authController.loginUser);

// Rota de sair da conta (logout)
router.post('/logout', authController.logoutUser);

module.exports = router;