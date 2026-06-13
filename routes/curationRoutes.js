const express = require("express");
const curationController = require("../controllers/curationController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

const router = express.Router();

router.get("/:collectionId", curationController.getCuratedMovies);
router.post("/", auth, admin, curationController.upsertCuratedMovie);
router.patch("/:collectionId/reorder", auth, admin, curationController.reorderCuratedMovies);
router.delete("/:collectionId/:videoId", auth, admin, curationController.removeCuratedMovie);

module.exports = router;
