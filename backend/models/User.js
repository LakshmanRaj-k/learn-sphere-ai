const { supabase, isConfigured } = require("../config/db");

const memoryUsers = new Map();
let nextMemoryId = 1;

async function createUser({ name, email, password, role }) {
  if (!isConfigured) {
    const id = `local-${nextMemoryId++}`;
    const user = { id, name, email, password, role };
    memoryUsers.set(String(email).toLowerCase(), user);
    return id;
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password, role }])
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

async function findUserByEmail(email) {
  if (!isConfigured) {
    return memoryUsers.get(String(email).toLowerCase()) || null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

module.exports = {
  createUser,
  findUserByEmail,
};

