const express = require("express");
const youtubeController = require("../controllers/youtubeController");

const router = express.Router();

router.get("/search", youtubeController.searchMovies);
router.get("/videos/:videoId", youtubeController.getMovieDetails);

module.exports = router;
