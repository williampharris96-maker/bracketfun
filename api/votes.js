const { neon } = require('@neondatabase/serverless');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

async function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') { resolve(req.body); return; }
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch(e) { resolve({}); }
    });
  });
}

module.exports = async (req, res) => {
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'GET') {
      const { voter_id } = req.query;

      // Aggregated tallies for all matchups
      const tallies = await sql`
        SELECT round_idx, match_idx, team_idx, COUNT(*)::int as count
        FROM votes
        GROUP BY round_idx, match_idx, team_idx
        ORDER BY round_idx, match_idx, team_idx
      `;

      // This voter's locked-in choices
      let myVotes = [];
      if (voter_id) {
        myVotes = await sql`
          SELECT round_idx, match_idx, team_idx
          FROM votes WHERE voter_id = ${voter_id}
        `;
      }

      return res.status(200).json({ tallies, myVotes });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const { voter_id, round_idx, match_idx, team_idx } = body;

      if (!voter_id || round_idx === undefined || match_idx === undefined || team_idx === undefined) {
        return res.status(400).json({ error: 'voter_id, round_idx, match_idx, team_idx required' });
      }

      // One vote per matchup — locked forever, no changes allowed
      const [existing] = await sql`
        SELECT id FROM votes
        WHERE voter_id = ${voter_id} AND round_idx = ${round_idx} AND match_idx = ${match_idx}
      `;
      if (existing) {
        return res.status(409).json({ error: 'already_voted', message: 'Vote already cast for this matchup.' });
      }

      await sql`
        INSERT INTO votes (voter_id, round_idx, match_idx, team_idx, created_at)
        VALUES (${voter_id}, ${round_idx}, ${match_idx}, ${team_idx}, NOW())
      `;

      // Return updated tallies so client can refresh counts
      const tallies = await sql`
        SELECT round_idx, match_idx, team_idx, COUNT(*)::int as count
        FROM votes
        GROUP BY round_idx, match_idx, team_idx
        ORDER BY round_idx, match_idx, team_idx
      `;

      return res.status(200).json({ success: true, tallies });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('votes error:', e);
    return res.status(500).json({ error: e.message });
  }
};
