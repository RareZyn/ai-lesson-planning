const express = require("express");
const {
  receiveArray,
  receiveJson,
} = require("../openAIController/basicController");

const router = express.Router();

router.post("/array", receiveArray);
router.post("/json", receiveJson);
module.exports = router; 
