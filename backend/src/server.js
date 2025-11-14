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
// Adiciona a pasta 'uploads' aos arquivos estáticos para que as fotos de perfil funcionem
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


const authController = require('./controllers/authController.js');
const userRoutes = require('./routers/userRoutes.js');
// IMPORTANTE: Adiciona o middleware para carregar os dados do usuário (foto, nome) em res.locals.user
app.use(authController.injectUserData); 

const authRoutes = require('./routers/authRoutes.js');
app.use('/', authRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/feed');
    } else {
        res.redirect('/login');
    }
});

module.exports = app;

if(require.main === module){
    app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});}