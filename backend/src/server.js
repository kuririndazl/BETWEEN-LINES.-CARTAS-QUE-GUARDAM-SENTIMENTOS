const express = require('express');

//importação de pacotes essenciais
const dbPool = require('./models/connection.js');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

//Importação de rotas
//const authRoutes = require('./routers/authRoutes');

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//Configuração de sessão para login
app.use(session({
    // Usa uma chave secreta do .env (deve ser forte e aleatória)
    secret: process.env.SESSION_SECRET || 'chave-secreta-default', 
    resave: false, // Evita salvar a sessão se nada mudou
    saveUninitialized: false, // Evita criar sessões vazias
    cookie: { secure: process.env.NODE_ENV === 'production' } // Configurar HTTPS em produção
}));

//Configurações da view
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//rotas temporárias e gerais
const authRoutes = require('./routers/authRoutes.js');
app.use('/', authRoutes);

app.get("/teste", (req,res)=>{
  res.send(`Teste de requisição`)
})

app.get('/', (req, res) => {
    if (req.session.userId) {
        // Se logado, vai para o feed
        return res.redirect('/feed'); 
    }
    // Se não logado, vai para o login
    res.redirect('/login'); 
});

app.get('/feed', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Proteção básica
    }
    // Renderiza o feed com o nome do usuário logado
    res.render('feed', { username: req.session.username });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});