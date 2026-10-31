const express = require("express");
const { getHealth } = require("../controllers/healthController");
const { register, login } = require("../controllers/authController");
const { createClassHandler } = require("../controllers/classController");
const { joinClass } = require("../controllers/enrollmentController");
const { submitQuiz } = require("../controllers/quizController");
const { getClassAnalytics } = require("../controllers/analyticsController");
const { createModule, getModules, getModuleById } = require("../controllers/moduleController");

const router = express.Router();

// Simple demo route group for the API
router.get("/health", getHealth);
router.post("/register", register);
router.post("/login", login);
router.post("/create-class", createClassHandler);
router.post("/join-class", joinClass);
router.post("/submit-quiz", submitQuiz);
router.get("/class-analytics/:classId", getClassAnalytics);

// Module creation and fetching
router.post("/create-module", createModule);
router.get("/modules", getModules);
router.get("/module/:id", getModuleById);

module.exports = router;

