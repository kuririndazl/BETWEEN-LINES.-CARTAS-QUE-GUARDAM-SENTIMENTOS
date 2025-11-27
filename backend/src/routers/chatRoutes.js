// src/routers/chatRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const chatController = require('../controllers/chatController'); 

// Rota principal do chat
router.get('/chat', authController.ensureAuthenticated, chatController.getChatPage);

// Rota para uma conversa específica
router.get('/chat/:targetUserId', authController.ensureAuthenticated, chatController.getConversationPage);

// Rota para envio de mensagem
router.post('/chat/send-message', authController.ensureAuthenticated, chatController.sendChatMessage);

module.exports = router;