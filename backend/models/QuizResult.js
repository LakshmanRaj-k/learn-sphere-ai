const { supabase } = require("../config/db");

async function createQuizResult({ studentId, classId, topic, score }) {
  const { data, error } = await supabase
    .from('quiz_results')
    .insert([{ student_id: studentId, class_id: classId, topic, score }])
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

module.exports = {
  createQuizResult,
};

