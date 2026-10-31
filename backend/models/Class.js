const { supabase } = require("../config/db");

async function createClass({ className, subject, classCode, lecturerId }) {
  const { data, error } = await supabase
    .from('classes')
    .insert([{ 
      class_name: className, 
      subject, 
      class_code: classCode, 
      lecturer_id: lecturerId 
    }])
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

async function findClassByCode(classCode) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('class_code', classCode)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

module.exports = {
  createClass,
  findClassByCode,
};

