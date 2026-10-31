const { createQuizResult } = require("../models/QuizResult");

// POST /api/submit-quiz
// Body: { student_id, class_id, topic, score }
exports.submitQuiz = async (req, res) => {
  try {
    const { student_id, class_id, topic, score } = req.body || {};

    if (!student_id || !class_id || !topic || score === undefined) {
      return res.status(400).json({
        message: "student_id, class_id, topic and score are required",
      });
    }

    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      return res.status(400).json({ message: "score must be a number between 0 and 100" });
    }

    const id = await createQuizResult({
      studentId: student_id,
      classId: class_id,
      topic,
      score: numericScore,
    });

    return res.status(201).json({
      message: "Quiz result saved",
      resultId: id,
    });
  } catch (err) {
    console.error("Submit quiz error:", err);
    return res.status(500).json({ message: "Failed to save quiz result" });
  }
};

