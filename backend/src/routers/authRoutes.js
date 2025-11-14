const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController.js");

// Middleware para garantir que o usuário está autenticado
const ensureAuth = authController.ensureAuthenticated;

// Rotas de Autenticação
router.get("/register", authController.getRegisterPage);
router.post("/register", authController.registerUser);
router.get("/login", authController.getLoginPage);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logoutUser);


// Rotas de Páginas Principais (requer autenticação)
router.get("/feed", ensureAuth, authController.getFeedPage);


// AS ROTAS DE PERFIL FORAM MOVIDAS PARA userRoutes.js

module.exports = router;