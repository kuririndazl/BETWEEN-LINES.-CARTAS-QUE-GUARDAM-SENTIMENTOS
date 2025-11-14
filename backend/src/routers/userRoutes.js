const express = require("express");
const router = express.Router();
const multer = require('multer'); // Necessário para upload de arquivos
const path = require('path');

const userController = require("../controllers/userController.js");
const authController = require("../controllers/authController.js"); // Para o ensureAuth

// Configuração do Multer para upload de foto de perfil
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // O caminho é relativo a 'server.js', que está em 'src/'
        // O destino final será src/public/uploads/profile_pics
        cb(null, path.join(__dirname, '..', 'public', 'uploads', 'profile_pics'));
    },
    filename: (req, file, cb) => {
        // Nome do arquivo: userId-timestamp.extensão
        // O userId está disponível na sessão devido ao middleware de autenticação
        cb(null, `${req.session.userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // Limite de 2MB
});


// Middleware para garantir que o usuário está autenticado
const ensureAuth = authController.ensureAuthenticated;

// ROTAS DE PERFIL
router.get("/profile", ensureAuth, userController.getProfilePage);
router.get("/profile/edit", ensureAuth, userController.getEditProfilePage);

// Processa a atualização do perfil. 
// Multer deve vir antes do userController.updateProfile
router.post("/profile", ensureAuth, upload.single('profile_picture'), userController.updateProfile);


module.exports = router;