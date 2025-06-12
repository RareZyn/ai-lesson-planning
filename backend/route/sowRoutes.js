const express = require("express");
const { 
  // getAllSow, 
  createSow, 
  // updateSow, 
  // deleteSow 
  getSowByGrade
} = require("../controller/sowController");
const { protect } = require('../middleware/auth');


const router = express.Router();

router.use(protect); // Protect all routes in this router
router.get('/:grade', getSowByGrade);
// router.get('/', getAllSow);
router.post('/', createSow);
// router.put('/:id', updateSow);
// router.delete('/:id', deleteSow);

module.exports = router;
