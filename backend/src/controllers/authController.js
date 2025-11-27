const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

const pool = {}; 

// Middleware para garantir que o usuário está autenticado
function ensureAuthenticated(req, res, next) {
    if (!req.session.userId) {
        // Redireciona o usuário para login se não estiver autenticado
        return res.redirect('/login');
    }
    next();
}

// Middleware para buscar dados do usuário e injetar em res.locals (para o Header EJS)
exports.injectUserData = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await userModel.findUserById(req.session.userId);
            if (user) {
                // Adiciona dados do usuário logado em res.locals, acessível em qualquer View EJS
                res.locals.user = user; 
            }
        } catch (error) {
            console.error("Erro ao carregar dados do usuário para res.locals:", error);
            // Continua, mas o usuário pode não ter a foto/nome no header
        }
    }
    // Garante que res.locals.user existe, mesmo que seja nulo
    res.locals.user = res.locals.user || null;
    next();
};


/**
 * Renderiza a página de cadastro.
 */
exports.getRegisterPage = (req, res) => {
    res.render('pages/register', { error: null });
};

/**
 * Processa o cadastro de um novo usuário.
 */
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    
    // Simples validação
    if (!username || !email || !password) {
        return res.render('pages/register', { error: 'Por favor, preencha todos os campos.' });
    }

    try {
        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.render('pages/register', { error: 'Este e-mail já está cadastrado.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const userId = await userModel.createUser(username, email, passwordHash);
        
        // Autentica o usuário após o cadastro
        req.session.userId = userId;

        return res.redirect('/feed');

    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.render('pages/register', { error: 'Erro interno ao tentar cadastrar. Tente novamente mais tarde.' });
    }
};

/**
 * Renderiza a página de login.
 */
exports.getLoginPage = (req, res) => {
    res.render('pages/login', { error: null });
};

/**
 * Processa o login de um usuário.
 */
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findUserByEmail(email);

        if (!user) {
            return res.render('pages/login', { error: 'E-mail ou senha incorretos.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.render('pages/login', { error: 'E-mail ou senha incorretos.' });
        }
        
        // Login bem-sucedido: Armazena dados na sessão
        req.session.userId = user.user_id;

        res.redirect('/feed');

    } catch (error) {
        console.error('Erro ao logar usuário:', error);
        res.render('pages/login', { error: 'Erro interno ao tentar logar. Tente novamente mais tarde.' });
    }
};

/**
 * Renderiza a página de feed.
 */
exports.getFeedPage = (req, res) => {
    // A autenticação é feita pelo middleware ensureAuthenticated
    // Os dados do usuário estão em res.locals.user
    res.render('pages/feed', { message: null });
};

/**
 * Desloga o usuário e destrói a sessão.
 */
exports.logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao destruir a sessão:', err);
            return res.status(500).send('Erro ao sair.');
        }
        res.clearCookie('user_sid'); 
        res.redirect('/login');
    });
};

// Exporta o middleware de autenticação para uso nas rotas
exports.ensureAuthenticated = ensureAuthenticated;