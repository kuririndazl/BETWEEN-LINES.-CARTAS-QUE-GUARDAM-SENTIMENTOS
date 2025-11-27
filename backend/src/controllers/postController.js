const postModel = require('../models/postModel');
const path = require('path');
const fs = require('fs');


exports.getWriteLetterPage = (req, res) => {
    // Garante que a view terá os dados de user (injetados por authController.injectUserData)
    res.render('pages/write-letter', { error: null, message: null });
};

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

exports.deletePost = async (req, res) => {
    // O ID do usuário logado vem da sessão
    const userId = req.session.userId;
    // O ID do post a ser deletado vem do corpo da requisição (geralmente via formulário ou AJAX)
    const { postId } = req.body; 

    if (!postId) {
        return res.status(400).json({ success: false, message: 'ID do post ausente.' });
    }

    try {
        const deleted = await postModel.deletePost(postId, userId);

        if (deleted) {
            // Em uma rede social, você também precisaria deletar a imagem associada do disco aqui.
            return res.json({ success: true, message: 'Postagem deletada com sucesso.' });
        } else {
            // Isso ocorre se o post_id não existir OU se o user_id não for o autor.
            return res.status(403).json({ success: false, message: 'Não autorizado ou post não encontrado.' });
        }
    } catch (error) {
        console.error('Erro ao deletar post:', error);
        return res.status(500).json({ success: false, message: 'Erro interno ao deletar post.' });
    }
};


exports.reportPost = async (req, res) => {
    const reporterId = req.session.userId;
    const { postId, reason } = req.body; 

    if (!postId || !reason) {
        return res.status(400).json({ success: false, message: 'ID do post ou motivo ausente.' });
    }

    try {
        await postModel.registerReport(reporterId, postId, reason);
        // Retorna sucesso mesmo se for apenas um log, conforme a regra de negócio
        return res.json({ success: true, message: 'Denúncia registrada com sucesso. Agradecemos sua colaboração.' });
    } catch (error) {
        console.error('Erro ao registrar denúncia:', error);
        return res.status(500).json({ success: false, message: 'Erro interno ao registrar denúncia.' });
    }
};