const userModel = require('../models/userModel');
const postModel = require('../models/postModel'); 
const path = require('path');
const fs = require('fs'); 


exports.getProfilePage = async (req, res) => {
    const loggedInUserId = res.locals.user.user_id; 
    
    try {
        const targetUser = await userModel.findUserById(loggedInUserId);
        
        // 1. Busca as estatísticas e posts
        const [postCount, lettersSent, lettersReceived, userPosts] = await Promise.all([
            postModel.countPostsByUserId(loggedInUserId),
            userModel.countSentDirectLetters(loggedInUserId),
            userModel.countReceivedDirectLetters(loggedInUserId),
            postModel.getPostsByUserId(loggedInUserId),
        ]);
        
        const stats = {
            postCount: postCount,
            lettersSent: lettersSent,
            lettersReceived: lettersReceived,
        };

        // 2. Renderiza a view 'profile.ejs'
        res.render('pages/profile', { 
            profile: targetUser,             
            stats: stats,
            userPosts: userPosts,
            error: null 
        });
        
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        const stats = { postCount: 0, lettersSent: 0, lettersReceived: 0 };
        res.render('pages/profile', { 
            profile: res.locals.user, 
            stats: stats, 
            userPosts: [], 
            error: 'Erro ao carregar estatísticas e cartas.' 
        });
    }
};

/**
 * Renderiza a página de PERFIL ALHEIO (/profile/:userId).
 */
exports.getOtherProfilePage = async (req, res) => {
    const loggedInUserId = res.locals.user.user_id; 
    const targetUserId = parseInt(req.params.userId);

    // Evita carregar o próprio perfil na rota alheia, redirecionando para a rota correta
    if (loggedInUserId === targetUserId) {
        return res.redirect('/profile'); 
    }

    try {
        const targetUser = await userModel.findUserById(targetUserId);

        if (!targetUser) {
            return res.status(404).render('pages/error', { message: 'Perfil não encontrado.' });
        }
        
        // 1. Busca o status de 'seguindo'
        const isFollowing = await userModel.isFollowing(loggedInUserId, targetUserId);

        // 2. Busca as estatísticas e posts
        const [postCount, lettersSent, lettersReceived, userPosts] = await Promise.all([
            postModel.countPostsByUserId(targetUserId),
            userModel.countSentDirectLetters(targetUserId),
            userModel.countReceivedDirectLetters(targetUserId),
            postModel.getPostsByUserId(targetUserId),
        ]);
        
        const stats = {
            postCount: postCount,
            lettersSent: lettersSent,
            lettersReceived: lettersReceived,
        };

        // 3. Renderiza a nova view 'otherprofile.ejs'
        res.render('pages/otherprofile', { 
            profile: targetUser,             // Dados do perfil que está sendo visto
            stats: stats,
            userPosts: userPosts,
            isFollowing: isFollowing,        // Flag para botão de Seguir/Deixar de Seguir
            error: null 
        });
        
    } catch (error) {
        console.error('Erro ao buscar dados do perfil alheio:', error);
        return res.status(500).render('pages/error', { message: 'Erro interno ao carregar o perfil.' });
    }
};


/**
 * Ação de Seguir/Deixar de Seguir um usuário via AJAX.
 */
exports.toggleFollow = async (req, res) => {
    const followerId = req.session.userId;
    const { followingId, action } = req.body; 

    if (followerId === parseInt(followingId)) {
        return res.status(400).json({ success: false, message: 'Você não pode seguir a si mesmo.' });
    }

    try {
        let success = false;
        if (action === 'follow') {
            success = await userModel.followUser(followerId, followingId);
            return res.json({ success: success, message: success ? 'Seguindo!' : 'Você já segue este usuário.' });
        } else if (action === 'unfollow') {
            success = await userModel.unfollowUser(followerId, followingId);
            return res.json({ success: success, message: success ? 'Deixou de seguir.' : 'Você não segue este usuário.' });
        } else {
            return res.status(400).json({ success: false, message: 'Ação inválida.' });
        }
    } catch (error) {
        console.error('Erro ao seguir/deixar de seguir:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
};

/**
 * Renderiza a página de edição de perfil.
 */
exports.getEditProfilePage = async (req, res) => {
    // Autenticação já garantida, dados do usuário já em res.locals.user
    const user = res.locals.user;
    res.render('pages/edit-profile', { user: user, error: null, message: null });
};

/**
 * Processa a atualização do perfil.
 */
exports.updateProfile = async (req, res) => {
    // VERIFICAÇÃO DE SEGURANÇA: Garante que o usuário está logado e que os dados estão disponíveis
    if (!req.session.userId || !res.locals.user) {
        console.error('Erro de autenticação: req.session.userId ou res.locals.user ausente no updateProfile.');
        // O ensureAuthenticated já deve ter tratado isso, mas é bom para redundância.
        return res.redirect('/login'); 
    }

    const userId = req.session.userId;
    const { username, bio } = req.body;
    
    // CORREÇÃO MANTIDA: Usa res.locals.user para pegar a URL atual se nenhuma foto nova for enviada.
    let profilePictureUrl = res.locals.user.profilePictureUrl; 

    try {
        // 1. Lidar com o upload da imagem (se houver)
        if (req.file) {
            // Buscamos o usuário para pegar a foto antiga e deletá-la
            const oldUser = await userModel.findUserById(userId);
            const oldProfilePictureUrl = oldUser.profilePictureUrl;
            
            // 2. Criar o novo caminho (relativo à pasta public)
            const newPicturePath = `/public/uploads/profile_pics/${req.file.filename}`;
            profilePictureUrl = newPicturePath;

            // 3. Deletar a imagem antiga, se não for a padrão
            const defaultPath = '/public/images/default_avatar.png';
            if (oldProfilePictureUrl && oldProfilePictureUrl !== defaultPath) {
                
                // Base do diretório de uploads, partindo de src/controllers (este arquivo)
                const baseDir = path.join(__dirname, '..', 'public', 'uploads', 'profile_pics');
                // Pega apenas o nome do arquivo da URL salva no banco de dados
                const oldFileName = path.basename(oldProfilePictureUrl); 
                const filePathToDelete = path.join(baseDir, oldFileName);

                fs.unlink(filePathToDelete, (err) => {
                    if (err) {
                        // Ignora erro se o arquivo não existir (ENOENT), mas registra outros
                        if (err.code !== 'ENOENT') { 
                           console.error('Erro ao deletar imagem antiga:', err);
                        }
                    }
                });
            }
            
            // 4. Atualizar o banco de dados com a nova URL
            await userModel.updateProfilePicture(userId, profilePictureUrl);
        }

        // 5. Atualizar username e bio
        await userModel.updateUserProfile(userId, username, bio);

        // Recarrega os dados do usuário para a próxima renderização e res.locals.user
        const updatedUser = await userModel.findUserById(userId);
        res.locals.user = updatedUser; 

        res.render('pages/edit-profile', { 
            user: updatedUser, 
            error: null, 
            message: 'Perfil atualizado com sucesso!' 
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.render('pages/edit-profile', { 
            // Garante que a view use o dado mais atualizado que existe em res.locals.user
            user: res.locals.user, 
            error: 'Erro interno ao tentar atualizar o perfil.', 
            message: null 
        });
    }
};