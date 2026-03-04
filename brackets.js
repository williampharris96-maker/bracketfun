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
      const { email } = req.query;
      if (email) {
        const [row] = await sql`SELECT * FROM brackets WHERE LOWER(email) = LOWER(${email})`;
        return res.status(200).json(row || null);
      } else {
        const rows = await sql`SELECT email, name, locked, updated_at, bracket_data FROM brackets`;
        return res.status(200).json(rows);
      }
    }

    if (req.method === 'POST') {
      const { email, name, bracket_data, locked } = req.body;
      if (!email || !bracket_data) return res.status(400).json({ error: 'email and bracket_data required' });

      await sql`
        INSERT INTO brackets (email, name, bracket_data, locked, updated_at)
        VALUES (${email.toLowerCase()}, ${name}, ${JSON.stringify(bracket_data)}, ${locked ?? false}, NOW())
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          bracket_data = EXCLUDED.bracket_data,
          locked = EXCLUDED.locked,
          updated_at = NOW()
      `;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('brackets error:', e);
    return res.status(500).json({ error: e.message });
  }
};
