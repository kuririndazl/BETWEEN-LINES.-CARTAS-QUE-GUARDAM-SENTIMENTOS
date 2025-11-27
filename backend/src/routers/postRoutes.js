// src/routers/postRoutes.js

const express = require("express");
const router = express.Router();
const multer = require('multer'); 
const path = require('path');

const postController = require("../controllers/postController.js");
const authController = require("../controllers/authController.js");

// Middleware para garantir que o usuário está autenticado
const ensureAuth = authController.ensureAuthenticated;


// Configuração do Multer para upload de imagens de post
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // O destino final será src/public/uploads/post_images
        cb(null, path.join(__dirname, '..', 'public', 'uploads', 'post_images'));
    },
    filename: (req, file, cb) => {
        // Nome do arquivo: userId-timestamp.extensão
        cb(null, `${req.session.userId}-post-${Date.now()}${path.extname(file.originalname)}`);
    }
});
// Limite de 5MB por arquivo, 1 arquivo de imagem
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

router.get("/new-letter", ensureAuth, postController.getWriteLetterPage);

router.post("/new-letter", ensureAuth, upload.single('post_image'), postController.createPost);

router.post('/post/delete', authController.ensureAuthenticated, postController.deletePost);

// Rota para denunciar um post (protegida por autenticação)
router.post('/post/report', authController.ensureAuthenticated, postController.reportPost);

module.exports = router;