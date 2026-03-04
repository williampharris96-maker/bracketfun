const { neon } = require('@neondatabase/serverless');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

module.exports = async (req, res) => {
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

  const results = {};

  // 1. Check DATABASE_URL exists
  results.has_database_url = !!process.env.DATABASE_URL;
  results.database_url_preview = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@').slice(0, 60) + '...'
    : 'NOT SET';

  // 2. Try creating neon client
  try {
    const sql = neon(process.env.DATABASE_URL);
    results.client_created = true;

    // 3. Try a simple query
    const rows = await sql`SELECT 1 as ok`;
    results.query_ok = rows[0].ok === 1;

    // 4. Check tables exist
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    results.tables = tables.map(t => t.table_name);

  } catch(e) {
    results.error = e.message;
    results.error_type = e.constructor.name;
  }

  return res.status(200).json(results);
};
