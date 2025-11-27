const chatModel = require('../models/chatModel');
const userModel = require('../models/userModel');

exports.getChatPage = async (req, res) => {
    // Se o usuário tentar acessar /chat sem um alvo, mostra a tela principal
    res.render('pages/chat', { 
        user: res.locals.user, 
        activeConversations: [], 
        targetUser: null,
        messages: [],
        error: null 
    });
};

/**
 * Renderiza uma conversa específica com um usuário alvo.
 */
exports.getConversationPage = async (req, res) => {
    const loggedInUserId = res.locals.user.user_id;
    const targetUserId = parseInt(req.params.targetUserId);

    if (loggedInUserId === targetUserId) {
         // Não permite conversar consigo mesmo
         return res.redirect('/chat'); 
    }

    try {
        const targetUser = await userModel.findUserById(targetUserId);
        if (!targetUser) {
            return res.status(404).render('pages/error', { message: 'Usuário de chat não encontrado.' });
        }
        
        const conversationId = await chatModel.findOrCreateConversation(loggedInUserId, targetUserId);
        const messages = await chatModel.getMessagesByConversationId(conversationId);
        
        res.render('pages/chat', {
            user: res.locals.user,
            activeConversations: [], // Simplificado por enquanto
            targetUser: targetUser,
            messages: messages,
            error: null
        });

    } catch (error) {
        console.error('Erro ao carregar conversa:', error);
        res.status(500).render('pages/chat', { 
            user: res.locals.user, 
            activeConversations: [], 
            targetUser: null,
            messages: [],
            error: 'Não foi possível carregar a conversa.' 
        });
    }
};

/**
 * Persiste a mensagem no DB e atualiza a estatística de 'cartas privadas'.
 * O real-time é feito com Socket.io (fora deste escopo HTTP).
 */
exports.sendChatMessage = async (req, res) => {
    const senderId = req.session.userId;
    const { receiverId, content, type = 'text', mediaUrl = null } = req.body;

    if (!receiverId || !content) {
        return res.status(400).json({ success: false, message: 'Dados insuficientes.' });
    }

    try {
        // 1. Persistência da mensagem (DB)
        const conversationId = await chatModel.findOrCreateConversation(senderId, parseInt(receiverId));
        await chatModel.createChatMessage(conversationId, senderId, content, type, mediaUrl);
        
        // 2. Atualiza a estatística: +1 carta enviada/recebida
        await chatModel.registerPrivateLetter(senderId, parseInt(receiverId)); 

        return res.json({ success: true, message: 'Mensagem enviada com sucesso.' });

    } catch (error) {
        console.error('Erro ao enviar mensagem de chat:', error);
        return res.status(500).json({ success: false, message: 'Erro interno ao enviar a mensagem.' });
    }
};