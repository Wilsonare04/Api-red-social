const express = require("express");
const router = express.Router();
const multer = require("multer");
const UserContoller = require("../controllers/user");
const check = require("../middlewares/auth");
const checkAdmin = require("../middlewares/admin");

// Configuracion de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/avatars/")
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-"+Date.now()+"-"+file.originalname);
    }
});

const uploads = multer({storage});

// Definir rutas
router.get("/prueba-usuario", check.auth, UserContoller.pruebaUser);
router.post("/register", UserContoller.register);
router.post("/login", UserContoller.login);
router.get("/profile/:id", check.auth, UserContoller.profile);
router.get("/list/:page?", check.auth, UserContoller.list);
router.put("/update", check.auth, UserContoller.update);
router.post("/upload", [check.auth, uploads.single("file0")], UserContoller.upload);
router.get("/avatar/:file", UserContoller.avatar); // cambio
router.get("/counters/:id", check.auth, UserContoller.counters);
router.delete("/remove/:id", [check.auth, checkAdmin.isAdmin], UserContoller.remove);
router.post("/google-auth", UserContoller.googleAuth);
router.get("/pending-registrations", [check.auth, checkAdmin.isAdmin], UserContoller.getPendingUsers);
router.put("/approve-user/:id", [check.auth, checkAdmin.isAdmin], UserContoller.approveUser);
router.put("/reject-user/:id", [check.auth, checkAdmin.isAdmin], UserContoller.rejectUser);

// Exportar router
module.exports = router;