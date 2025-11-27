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

const ensureAuth = authController.ensureAuthenticated;

router.get('/profile', authController.ensureAuthenticated, userController.getProfilePage);

router.get('/profile/edit', authController.ensureAuthenticated, userController.getEditProfilePage);
router.post('/profile/edit', authController.ensureAuthenticated, upload.single('profilePicture'), userController.updateProfile);

router.get('/profile/:userId', authController.ensureAuthenticated, userController.getOtherProfilePage);


router.post('/user/toggle-follow', authController.ensureAuthenticated, userController.toggleFollow);

module.exports = router;