// Centralized supabase client accessor
// This module returns the client initialized by `src/config/db.js` (via getClient)
const db = require('../config/db');

function getSupabase() {
	return db.getClient();
}

module.exports = { getSupabase };
