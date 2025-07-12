const router = require("express").Router();
const dmLogController = require("../controller/dmLogController");

router.get("/", dmLogController.getDMLogs);
router.get("/:id", dmLogController.getDMLogById);
router.delete("/:id", dmLogController.deleteDMLog);

module.exports = router;
