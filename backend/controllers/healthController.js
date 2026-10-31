exports.getHealth = (req, res) => {
  res.json({
    status: "ok",
    service: "LearnSphere AI API",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
};

