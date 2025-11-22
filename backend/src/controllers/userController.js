const userModel = require('../models/userModel');
const postModel = require('../models/postModel'); 
const path = require('path');
const fs = require('fs'); 

exports.getProfilePage = async (req, res) => {
    // Autenticação já garantida pelo middleware, dados do usuário já em res.locals.user
    const user = res.locals.user;
    
    try {
        const userId = user.user_id;

        // NOVO: Faz a chamada simultânea para buscar todos os dados reais
        const [postCount, lettersSent, lettersReceived] = await Promise.all([
            // 1. Posts (Cartas Públicas)
            postModel.countPostsByUserId(userId),
            // 2. Cartas Diretas Enviadas
            userModel.countSentDirectLetters(userId),
            // 3. Cartas Diretas Recebidas
            userModel.countReceivedDirectLetters(userId),
        ]);
        
        // Dados de estatísticas com valores reais
        const stats = {
            postCount: postCount,           // Contagem real da tabela Posts
            lettersSent: lettersSent,       // Contagem real da tabela Direct_Letters (sender_id)
            lettersReceived: lettersReceived, // Contagem real da tabela Direct_Letters (receiver_id)
        };

        // A página de perfil precisa dos dados do próprio usuário.
        res.render('pages/profile', { profile: user, stats: stats });
        
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        
        // Em caso de erro, renderiza com zero posts, mas exibe o perfil
        const stats = { postCount: 0, lettersSent: 0, lettersReceived: 0 };
        res.render('pages/profile', { profile: user, stats: stats, error: 'Erro ao carregar estatísticas.' });
    }
};

exports.getProfilePage = async (req, res) => {
    const user = res.locals.user;
    
    try {
        const userId = user.user_id;

        // NOVO: Adiciona a busca dos posts no Promise.all
        const [postCount, lettersSent, lettersReceived, userPosts] = await Promise.all([
            // 1. Posts (Cartas Públicas)
            postModel.countPostsByUserId(userId),
            // 2. Cartas Diretas Enviadas
            userModel.countSentDirectLetters(userId),
            // 3. Cartas Diretas Recebidas
            userModel.countReceivedDirectLetters(userId),
            // 4. Busca as Cartas Públicas (para exibir no grid)
            postModel.getPostsByUserId(userId),
        ]);
        
        const stats = {
            postCount: postCount,
            lettersSent: lettersSent,
            lettersReceived: lettersReceived,
        };

        // A página de perfil precisa dos dados do próprio usuário e dos posts.
        res.render('pages/profile', { 
            profile: user, 
            stats: stats,
            userPosts: userPosts, // NOVO: Passa as cartas do usuário para a view
            error: null 
        });
        
    } catch (error) {
        // ... (resto do bloco catch, garantindo que userPosts seja um array vazio em caso de erro)
        console.error('Erro ao buscar dados do perfil:', error);
        const stats = { postCount: 0, lettersSent: 0, lettersReceived: 0 };
        res.render('pages/profile', { 
            profile: user, 
            stats: stats, 
            userPosts: [], 
            error: 'Erro ao carregar estatísticas e cartas.' 
        });
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