const express = require('express');
const dbPool = require('./models/connection.js');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

//Importação de rotas
const authRoutes = require('./routes/authRoutes');

//Configurações para as rotas do Node.js servirem o frontend, com arquivos estáticos ou dinâmicos
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//rotas usadas

app.use('/', authRoutes);

app.get("/teste", (req,res)=>{
  res.send(`Teste de requisição`)
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});