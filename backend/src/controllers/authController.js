const userModel = require('../models/userModel');
const bcrypt = require('bcrypt'); // Para hashing de senhas

// Constante para o custo de criptografia
const SALT_ROUNDS = 10; 

// A. Função para exibir a página de Cadastro (GET /register)
exports.getRegisterPage = (req, res) => {
    // O Controller renderiza a View, passando variáveis
    res.render('register', { error: null });
};

// B. Função para processar o Cadastro (POST /register)
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    
    // 1. Validação Simples (O Controller valida os dados)
    if (!username || !email || !password) {
        return res.render('register', { error: 'Por favor, preencha todos os campos.' });
    }

    try {
        // 2. Lógica de Segurança: Criptografar a senha (bcrypt)
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // 3. Lógica de Dados: Chamar o Model para inserção
        await userModel.createUser(username, email, passwordHash);
        
        // 4. Sucesso: Redirecionar para o login
        res.redirect('/login');

    } catch (error) {
        console.error('Erro de registro:', error);
        // O MySQL pode retornar um erro se o email já for UNIQUE
        if (error.code === 'ER_DUP_ENTRY') {
            return res.render('register', { error: 'E-mail já cadastrado.' });
        }
        res.render('register', { error: 'Ocorreu um erro ao tentar se cadastrar.' });
    }
};

// C. Função para exibir a página de Login (GET /login)
exports.getLoginPage = (req, res) => {
    res.render('login', { error: null });
};

// D. Função para processar o Login (POST /login)
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Lógica de Dados: Buscar o usuário pelo email
        const user = await userModel.findUserByEmail(email);

        if (!user) {
            return res.render('login', { error: 'E-mail ou senha inválidos.' });
        }
        
        // 2. Lógica de Segurança: Comparar senha (bcrypt)
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (isPasswordValid) {
            // 3. Lógica de Negócio: Checar se o usuário está banido
            if (user.is_banned) {
                return res.render('login', { error: 'Sua conta está banida.' });
            }
            
            // 4. Sucesso: Gerar Sessão (O Controller gerencia o estado de login)
            req.session.userId = user.user_id;
            req.session.username = user.username;
            
            // Redirecionar para a área logada
            return res.redirect('/feed'); 
        } else {
            res.render('login', { error: 'E-mail ou senha inválidos.' });
        }

    } catch (error) {
        console.error('Erro de login:', error);
        res.render('login', { error: 'Ocorreu um erro interno no servidor.' });
    }
};

// E. Função para processar o Logout (POST /logout)
exports.logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
        }
        // Redirecionar para a tela de login/home pública
        res.redirect('/login'); 
    });
};