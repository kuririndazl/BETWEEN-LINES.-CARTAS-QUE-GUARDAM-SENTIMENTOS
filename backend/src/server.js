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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public'))); 

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
const postRoutes = require('./routers/postRoutes.js');
const chatRoutes = require('./routers/chatRoutes.js');
app.use(authController.injectUserData); 

const authRoutes = require('./routers/authRoutes.js');
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', postRoutes);
app.use('/', chatRoutes);

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