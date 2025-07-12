const automatedPostController = require("../controller/automatedPostController");
const authMiddleware = require("../middleware/auth");

const router = require("express").Router();

router.post("/", authMiddleware, automatedPostController.createAutomatedPost);
router.get("/", automatedPostController.getAllAutomatedPosts);
router.get("/:id", automatedPostController.getAutomatedPostById);
router.put("/:id", automatedPostController.updateAutomatedPost);
router.delete("/:id", automatedPostController.deleteAutomatedPost);
router.patch("/:id/toggle", automatedPostController.togglePostStatus);

module.exports = router;
