const { createClass } = require("../models/Class");

function generateClassCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// POST /api/create-class
// Body: { class_name, subject, lecturer_id }
exports.createClassHandler = async (req, res) => {
  try {
    const { class_name, subject, lecturer_id } = req.body || {};

    const normalizedName = typeof class_name === "string" ? class_name.trim() : "";
    const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
    if (!normalizedName || !normalizedSubject || !lecturer_id) {
      return res.status(400).json({
        message: "class_name, subject and lecturer_id are required",
      });
    }

    let code;
    let attempts = 0;
    let id;

    // Try a few times in case of rare code collisions.
    while (attempts < 5) {
      attempts += 1;
      code = generateClassCode(6);
      try {
        id = await createClass({
          className: normalizedName,
          subject: normalizedSubject,
          classCode: code,
          lecturerId: lecturer_id,
        });
        break;
      } catch (err) {
        if (err && err.code === "23505") {
          // collision, try again
          continue;
        }
        throw err;
      }
    }

    if (!id) {
      return res.status(500).json({ message: "Could not create class" });
    }

    return res.status(201).json({
      message: "Class created",
      classId: id,
      classCode: code,
    });
  } catch (err) {
    console.error("Create class error:", err);
    return res.status(500).json({ message: "Failed to create class" });
  }
};

