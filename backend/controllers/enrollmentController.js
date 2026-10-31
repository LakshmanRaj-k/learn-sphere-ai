const { findClassByCode } = require("../models/Class");
const { createEnrollment } = require("../models/Enrollment");

// POST /api/join-class
// Body: { student_id, class_code }
exports.joinClass = async (req, res) => {
  try {
    const { student_id, class_code } = req.body || {};
    const normalizedCode = typeof class_code === "string" ? class_code.trim().toUpperCase() : "";

    if (!student_id || !normalizedCode) {
      return res.status(400).json({ message: "student_id and class_code are required" });
    }

    const cls = await findClassByCode(normalizedCode);
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    try {
      const enrollmentId = await createEnrollment({
        studentId: student_id,
        classId: cls.id,
      });

      return res.status(201).json({
        message: "Joined class successfully",
        enrollmentId,
        classId: cls.id,
        className: cls.class_name,
      });
    } catch (err) {
      if (err && err.code === "23505") {
        return res
          .status(200)
          .json({ message: "Already joined this class", classId: cls.id });
      }
      throw err;
    }
  } catch (err) {
    console.error("Join class error:", err);
    return res.status(500).json({ message: "Failed to join class" });
  }
};

