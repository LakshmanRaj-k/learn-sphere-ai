const { supabase } = require("../config/db");

async function createEnrollment({ studentId, classId }) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert([{ student_id: studentId, class_id: classId }])
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

module.exports = {
  createEnrollment,
};

