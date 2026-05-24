const express = require("express");
const router = express.Router();
const LikeController = require("../controllers/like");
const check = require("../middlewares/auth");

// Rutas de Likes
router.post("/save/:id", check.auth, LikeController.save);
router.delete("/remove/:id", check.auth, LikeController.remove);
router.get("/publication/:id/:page?", check.auth, LikeController.listUsers);
router.get("/user/:id/:page?", check.auth, LikeController.listPublications);

module.exports = router;
