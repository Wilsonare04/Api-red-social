const express = require("express");
const router = express.Router();
const CommentController = require("../controllers/comment");
const check = require("../middlewares/auth");

// Rutas de Comentarios
router.post("/save", check.auth, CommentController.save);
router.delete("/remove/:id", check.auth, CommentController.remove);
router.get("/publication/:id/:page?", check.auth, CommentController.list);

module.exports = router;
