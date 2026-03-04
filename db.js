const { neon } = require('@neondatabase/serverless');

let sql;
function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is not set');
  if (!sql) {
    try {
      sql = neon(process.env.DATABASE_URL);
    } catch(e) {
      throw new Error('Failed to create Neon client: ' + e.message);
    }
  }
  return sql;
}

module.exports = { getDb };
