const userModel = require('../models/userModel');
const path = require('path');
const fs = require('fs'); // Para deletar a imagem antiga

exports.getProfilePage = async (req, res) => {
    // Autenticação já garantida pelo middleware, dados do usuário já em res.locals.user
    const user = res.locals.user;
    
    // Dados de estatísticas mockados para o EJS
    const stats = {
        lettersSent: 42,
        lettersReceived: 18,
    };

    // A página de perfil precisa dos dados do próprio usuário.
    res.render('pages/profile', { profile: user, stats: stats });
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