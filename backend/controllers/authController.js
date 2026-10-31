const bcrypt = require("bcryptjs");
const { createUser, findUserByEmail } = require("../models/User");

// POST /api/register
// Body: { name, email, password, role }
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();
    if (!normalizedEmail || !normalizedName || String(password).length < 6) {
      return res.status(400).json({
        message: "A valid name, email and password of at least 6 characters are required",
      });
    }

    const normalizedRole =
      role === "lecturer" || role === "student" ? role : "student";

    const hashed = await bcrypt.hash(password, 10);

    const userId = await createUser({
      name: normalizedName,
      email: normalizedEmail,
      password: hashed,
      role: normalizedRole,
    });

    return res.status(201).json({
      message: "Registration successful",
      userId,
    });
  } catch (err) {
    // Duplicate email error from MySQL (ER_DUP_ENTRY)
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "Email already registered" });
    }

    console.error("Register error:", err);
    return res.status(500).json({ message: "Failed to register user" });
  }
};

// POST /api/login
// Body: { email, password, role? }
// Response: { userId, role }
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      const normalizedRole = role === "lecturer" || role === "student" ? role : "student";
      const hashed = await bcrypt.hash(String(password), 10);
      const nameFromEmail = normalizedEmail.split("@")[0] || "User";
      const userId = await createUser({
        name: nameFromEmail,
        email: normalizedEmail,
        password: hashed,
        role: normalizedRole,
      });
      return res.json({ userId, role: normalizedRole, created: true });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      userId: user.id,
      role: user.role || "student",
      created: false,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Failed to login" });
  }
};

