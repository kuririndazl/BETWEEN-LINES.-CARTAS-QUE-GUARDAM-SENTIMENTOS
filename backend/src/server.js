const express = require('express');

//importação de pacotes essenciais
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
const VIEWS_ROOT = path.join(__dirname, 'views')
app.set('views', VIEWS_ROOT);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Configuração de sessão para login
app.use(session({
    secret: process.env.SESSION_SECRET || 'chave-secreta-default', 
    resave: false,
    saveUninitialized: false,
    name: 'user_sid', 
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 semana com cookies
    }
}));


const authRoutes = require('./routers/authRoutes.js');
app.use('/', authRoutes);

app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/feed');
    } else {
        res.redirect('/login');
    }
});

app.get('/feed', (req, res) => {
    console.log('ID do Usuário na Sessão:', req.session.userId); 
    
    if (!req.session.userId) {
        // Redireciona se não estiver autenticado
        return res.redirect('/login');
    }
    
    //pages/feed correto, não mude esse redirecionamento!
    res.render('pages/feed', { username: req.session.username }); 
});

module.exports = app;

if(require.main === module){
    app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});}