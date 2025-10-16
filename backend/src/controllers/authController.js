const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; 

exports.getRegisterPage = (req, res) => {
    res.render('pages/register', { error: null }); 
};

exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    
    // ... validação dos dados
    if (!username || !email || !password) {
        return res.render('pages/register', { error: 'Por favor, preencha todos os campos.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        await userModel.createUser(username, email, passwordHash);
        
        res.redirect('/login'); 

    } catch (error) {
        console.error('Erro de registro:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.render('pages/register', { error: 'E-mail já cadastrado.' }); 
        }
        res.render('pages/register', { error: 'Ocorreu um erro ao tentar se cadastrar.' });
    }
};

// C. Função para exibir a página de Login (GET /login)
exports.getLoginPage = (req, res) => {
    res.render('pages/login', { error: null }); 
};

// D. Função para processar o Login (POST /login)
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // ...
        if (!user) {
            return res.render('pages/login', { error: 'E-mail ou senha inválidos.' });
        }
        
        // ... comparação e validação
        if (isPasswordValid) {
            if (user.is_banned) {
                return res.render('pages/login', { error: 'Sua conta está banida.' });
            }
            
            // ... gerar sessão
            
            return res.redirect('/feed'); 
        } else {
            res.render('pages/login', { error: 'E-mail ou senha inválidos.' });
        }

    } catch (error) {
        console.error('Erro de login:', error);
        res.render('pages/login', { error: 'Ocorreu um erro interno no servidor.' });
    }
};

// E. Função para processar o Logout (POST /logout)
exports.logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
        }

        res.redirect('/login'); 
    });
};