const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");
const auth = require("../middlewares/authMiddleware")

router.post("/save", auth, movieController.saveMovie);
router.get("/:category", auth, movieController.getSavedMovies);
router.delete("/:videoId/:category", auth, movieController.removeMovie);

module.exports = router;
