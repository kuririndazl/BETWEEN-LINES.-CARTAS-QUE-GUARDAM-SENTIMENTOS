const userModel = require('../models/userModel.js');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; 

exports.getRegisterPage = (req, res) => {
    if (req.session.userId) {
        // Se já logado, redireciona para o feed
        return res.redirect('/feed'); 
    }
    // Assumindo que a view de registro está em 'views/pages/register.ejs'
    res.render('pages/register', { error: null }); 
};

exports.registerUser = async (req, res) => {
    const { username, email, password, confirm_password } = req.body;
    
    if (!username || !email || !password || !confirm_password) {
        return res.render('pages/register', { error: 'Por favor, preencha todos os campos.' });
    }

    if (password !== confirm_password) {
        return res.render('pages/register', { error: 'As senhas não coincidem.' });
    }

    try {
        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.render('pages/register', { error: 'E-mail já cadastrado.' });
        }
        
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        await userModel.createUser(username, email, passwordHash);
        
        // Cadastro bem-sucedido
        // O desvio de fluxo para /login com redirect está perfeito aqui.
        return res.redirect('/login'); 

    } catch (error) {
        console.error('--- ERRO FATAL NO CADASTRO ---');
        console.error(error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.render('pages/register', { error: 'E-mail já cadastrado.' });
        }
        
        return res.render('pages/register', { error: 'Ocorreu um erro interno no servidor.' });
    }
};

exports.getLoginPage = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/feed'); 
    }
    // Assumindo que a view de login está em 'views/pages/login.ejs'
    res.render('pages/login', { error: null }); 
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findUserByEmail(email); 

        if (!user) {
            return res.render('pages/login', { error: 'E-mail ou senha inválidos.' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (isPasswordValid) {
            if (user.is_banned) {
                // CORREÇÃO DE RENDER: Se a conta estiver banida, o usuário deve ser redirecionado para a página de login
                return res.render('pages/login', { error: 'Sua conta está banida.' });
            }
            
            //Configura a sessão
            req.session.userId = user.user_id; // Use user_id conforme seu modelo
            req.session.username = user.username;
            
            //Salva a sessão e executa o redirecionamento DENTRO da função corretamente, de uma forma que não fique recarregando infinitamente esperando retorno.
            req.session.save(err => {
                if (err) {
                    console.error('Erro ao salvar sessão:', err);
                    return res.render('pages/login', { error: 'Erro de sessão interna.' });
                }
                
                // Se o save for bem-sucedido, redirecionamos para /feed
                return res.redirect('/feed');  
            });

        } else {
            return res.render('pages/login', { error: 'E-mail ou senha inválidos.' });
        }

    } catch (error) {
        console.error('Erro de login:', error);
        return res.render('pages/login', { error: 'Ocorreu um erro interno no servidor.' });
    }
};

exports.logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
        }

        res.redirect('/login'); 
    });
};
