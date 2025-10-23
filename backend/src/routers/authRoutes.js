const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController.js");

//Formulário de cadastro
router.get("/register", authController.getRegisterPage);

//Processa o cadastro do usuário
router.post("/register", authController.registerUser);

//Formulário de login login
router.get("/login", authController.getLoginPage);

//Processa página de login com usuário
router.post("/login", authController.loginUser);

//Rota de quando usuário quer sair da conta
router.post("logout", authController.logoutUser);

module.exports = router;