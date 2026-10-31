const { supabase } = require("../config/db");

// GET /api/class-analytics/:classId
// Returns: { totalStudents, averageScore, weakTopics: [{ topic, averageScore }] }
exports.getClassAnalytics = async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    if (!Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({ message: "Invalid classId" });
    }

    // Class enrollments are unique per student
    const { count: totalStudents, error: err1 } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    // Fetch scores to compute averages
    const { data: quizData, error: err2 } = await supabase
      .from('quiz_results')
      .select('score, topic')
      .eq('class_id', classId);

    if (err1 || err2) throw err1 || err2;

    let totalScore = 0;
    let scoresCount = 0;
    const topicStats = {};

    for (const row of (quizData || [])) {
      const score = Number(row.score);
      if (!Number.isFinite(score) || !row.topic) continue;
      totalScore += score;
      scoresCount++;
      
      if (!topicStats[row.topic]) {
        topicStats[row.topic] = { total: 0, count: 0 };
      }
      topicStats[row.topic].total += score;
      topicStats[row.topic].count++;
    }

    const averageScore = scoresCount > 0 ? (totalScore / scoresCount) : null;

    const topicsArr = Object.keys(topicStats).map(topic => ({
      topic,
      averageScore: topicStats[topic].total / topicStats[topic].count
    }));

    // Weak topics: lowest 5
    topicsArr.sort((a, b) => a.averageScore - b.averageScore);
    const weakTopics = topicsArr.slice(0, 5);

    return res.json({
      totalStudents: totalStudents || 0,
      averageScore,
      weakTopics,
    });
  } catch (err) {
    console.error("Class analytics error:", err);
    return res.status(500).json({ message: "Failed to load analytics" });
  }
};

