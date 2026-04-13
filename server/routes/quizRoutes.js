const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { generateQuiz, gradeQuiz } = require('../controllers/quizController');

router.use(protect);

router.post('/generate', generateQuiz);
router.post('/grade', gradeQuiz);

module.exports = router;

