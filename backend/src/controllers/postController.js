// src/controllers/postController.js

const postModel = require('../models/postModel');
const path = require('path');
const fs = require('fs');

/**
 * Renderiza a página para escrever uma nova carta/post.
 */
exports.getWriteLetterPage = (req, res) => {
    // Garante que a view terá os dados de user (injetados por authController.injectUserData)
    res.render('pages/write-letter', { error: null, message: null });
};


/**
 * Processa o envio de uma nova carta/post.
 */
exports.createPost = async (req, res) => {
    const userId = req.session.userId;
    const { title, content, link } = req.body; // Adicionado 'link'

    // Garante que o usuário está logado
    if (!userId) {
        return res.redirect('/login');
    }

    // A carta deve ter ao menos título OU conteúdo.
    if (!title && !content) {
        return res.render('pages/write-letter', { 
            error: 'A carta precisa de um Título ou Conteúdo.',
            message: null,
            // Mantém os dados no formulário em caso de erro
            formData: { title, content, link } 
        });
    }

    let imageUrl = null;
    
    // Lidar com o upload da imagem (se houver)
    if (req.file) {
        // Cria o novo caminho (relativo à pasta public)
        imageUrl = `/public/uploads/post_images/${req.file.filename}`;
    }

    // Se a carta tem um link, podemos anexa-lo ao conteúdo (ou tratar em outra coluna)
    // Por simplicidade, vamos anexar ao conteúdo.
    let finalContent = content || '';
    if (link) {
        // Uma quebra de linha simples ou um separador
        finalContent += (finalContent ? '\n\n' : '') + `[Link Anexado: ${link}]`;
    }
    
    // Fallback: se não tiver conteúdo, use o título como um pequeno resumo.
    if (!finalContent && title) {
        finalContent = title; 
    }

    try {
        await postModel.createPost(userId, title, finalContent, imageUrl);
        
        // Redireciona para o feed após o sucesso
        return res.redirect('/feed?success=Carta enviada com sucesso!');

    } catch (error) {
        console.error('Erro ao criar post:', error);
        // Se houve erro no DB, mas a imagem foi salva, tentamos deletá-la para evitar lixo
        if (req.file && imageUrl) {
             const filePathToDelete = path.join(__dirname, '..', 'public', imageUrl.replace('/public', ''));
             fs.unlink(filePathToDelete, (err) => {
                if (err) console.error('Erro ao deletar imagem do post após falha no DB:', err);
             });
        }
        
        res.render('pages/write-letter', { 
            error: 'Erro interno ao tentar enviar a carta. Tente novamente mais tarde.',
            message: null,
            formData: { title, content, link } 
        });
    }
};


/**
 * Obtém todos os posts para exibir no feed.
 */
exports.getFeedPosts = async (req, res) => {
    try {
        const posts = await postModel.getAllPosts();
        
        // Renderiza o feed com os posts.
        // A view 'pages/feed' será atualizada para aceitar o array 'posts'
        res.render('pages/feed', { 
            // Os dados do usuário logado (res.locals.user) são injetados automaticamente
            // pela authController.injectUserData no Server.js
            posts: posts,
            message: req.query.success || null // Para mensagens de sucesso (ex: após criar post)
        });

    } catch (error) {
        console.error('Erro ao buscar posts para o feed:', error);
        res.render('pages/feed', { 
            posts: [], 
            message: 'Erro ao carregar o feed. Tente novamente mais tarde.'
        });
    }
};