// authController.js

const userModel = require('../models/userModel.js');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; 

exports.getRegisterPage = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/feed'); 
    }
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
        return res.redirect('/login'); 

    } catch (error) {
        console.error('--- ERRO FATAL NO CADASTRO ---');
        console.error(error);
        
        // Verifica se o erro é de duplicidade de e-mail (se não pego antes)
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
    res.render('pages/login', { error: null }); 
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findUserByEmail(email); 

        if (!user) {
            return res.render('pages/login', { error: 'E-mail ou senha inválidos.' });
        }
        
        // A chave 'passwordHash' deve existir graças ao userModel.js
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (isPasswordValid) {
            if (user.is_banned) {
                return res.render('pages/login', { error: 'Sua conta está banida.' });
            }
            
            // CRIAÇÃO DA SESSÃO
            req.session.userId = user.id; 
            req.session.username = user.username;
            
            // GARANTINDO O REDIRECIONAMENTO COM A SESSÃO SALVA
            req.session.save(err => {
                if (err) {
                    console.error('Erro ao salvar sessão:', err);
                    return res.render('pages/login', { error: 'Erro de sessão interna.' });
                }
                
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