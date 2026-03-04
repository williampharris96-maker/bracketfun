const { getDb } = require('./_db');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

module.exports = async (req, res) => {
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, name, email, created_at FROM registrants ORDER BY created_at ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, email } = req.body;
      if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

      const existing = await sql`SELECT id FROM registrants WHERE LOWER(email) = LOWER(${email})`;
      if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

      const [row] = await sql`INSERT INTO registrants (name, email) VALUES (${name}, ${email}) RETURNING *`;
      return res.status(201).json(row);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('registrants error:', e);
    return res.status(500).json({ error: e.message });
  }
};
