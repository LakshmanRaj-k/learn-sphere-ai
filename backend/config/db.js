const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase.
// URLs and Keys should be defined in the .env file.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const isConfigured = Boolean(supabaseUrl && supabaseKey);

const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

async function testConnection() {
  if (!isConfigured) {
    console.log("Supabase not configured; using local in-memory mode");
    return;
  }
  console.log("Supabase Client Initialized");
}

module.exports = {
  supabase,
  isConfigured,
  testConnection,
};

