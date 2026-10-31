const { supabase } = require("../config/db");

// Local fallback store for development/static mode
let inMemoryModules = [];

const createModule = async (req, res) => {
  try {
    const { subject, topics } = req.body || {};
    const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
    const normalizedTopics = Array.isArray(topics)
      ? topics.filter((topic) => typeof topic === "string" && topic.trim()).map((topic) => topic.trim())
      : [];
    
    if (!normalizedSubject || normalizedTopics.length === 0) {
      return res.status(400).json({ error: "Subject and topics are required." });
    }

    const localModule = {
      id: `m-${Date.now()}`,
      subject: normalizedSubject,
      topics: normalizedTopics,
      progress: 0,
      created_at: new Date().toISOString()
    };

    // Attempt to save to Supabase
    try {
      const { data, error } = await supabase
        .from('modules')
        .insert([{ subject: normalizedSubject, topics: normalizedTopics, progress: 0 }])
        .select()
        .single();

      if (!error && data) {
        return res.status(201).json(data);
      }
      console.warn("[ModuleController] Supabase error, using fallback:", error?.message || "Unknown error");
    } catch (dbErr) {
      console.warn("[ModuleController] Supabase connection failed, using local memory.");
    }

    // Fallback to memory
    inMemoryModules.push(localModule);
    res.status(201).json(localModule);
  } catch (error) {
    console.error("[ModuleController] Error creating module:", error.message);
    res.status(500).json({ error: "Failed to create learning module." });
  }
};

const getModules = async (req, res) => {
  try {
    // Attempt to fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Merge with local modules if needed, or just return data
        return res.status(200).json(data || []);
      }
    } catch (dbErr) {
      console.warn("[ModuleController] Fetch failed, returning local modules.");
    }

    // Return memory fallback
    res.status(200).json([...inMemoryModules].reverse());
  } catch (error) {
    console.error("[ModuleController] Error fetching modules:", error.message);
    res.status(500).json({ error: "Failed to fetch modules." });
  }
};

const getModuleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Attempt Supabase
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return res.status(200).json(data);
      }
    } catch (dbErr) {}

    // Check memory
    const local = inMemoryModules.find(m => m.id === id);
    if (local) return res.status(200).json(local);

    res.status(404).json({ error: "Module not found." });
  } catch (error) {
    console.error("[ModuleController] Error fetching module by ID:", error.message);
    res.status(500).json({ error: "Failed to fetch module." });
  }
};

module.exports = {
  createModule,
  getModules,
  getModuleById
};
