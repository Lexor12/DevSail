const {Pool}=require('pg'); 
const { env } = require('./env');
const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: {
    rejectUnauthorized: false
    },
    max:10,
});

module.exports = pool;