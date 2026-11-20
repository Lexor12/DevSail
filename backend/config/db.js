const {Pool}=require('pg'); 
const pool = new Pool({
    connectionString: process.env.SESSION_POOLER_SUPABASE_URL,
    ssl: {
    rejectUnauthorized: false
    },
    max:10,
});

module.exports = pool;