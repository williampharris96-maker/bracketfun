/**
 * NUMERO MARCH SADNESS — 2000 User Seed Script
 * 
 * Run with Node.js:
 *   node seed_2000_users.js
 * 
 * Or paste the generated SQL directly into your Neon SQL Editor.
 * 
 * This script generates realistic bracket picks using seed-weighted
 * probabilities (higher seeds win more often, but upsets happen).
 */

// ─── Team Setup (mirrors bracket.html) ───────────────────────────────────────

const regions = [
  {
    name: 'Indie',
    teams: {
      1: 'Duster', 2: 'Julie Doiron', 3: 'EAAY', 4: 'American Analog Set',
      5: 'Eiafuawn', 6: 'Husker Du', 7: 'Unwound', 8: 'Jejune',
      9: 'LLC', 10: 'Mineral', 11: 'Ozean', 12: 'Bedhead',
      13: 'Codeine', 14: 'Karate', 15: 'Sequoia', 16: 'Indian Summer'
    },
    playIn: 'Ida'
  },
  {
    name: 'Soul',
    teams: {
      1: 'Notations', 2: 'Syl Johnson', 3: 'Marion Black / Capso', 4: 'Penny & The Quarter',
      5: 'Ponderosa Twins', 6: 'TL Barrett', 7: 'Helene Smith', 8: 'Fathers Children',
      9: 'Royal Jesters', 10: 'Dreamliners', 11: 'UTB', 12: '24-Carat Black',
      13: 'Purple Snow', 14: 'Wee', 15: 'Trevor Dandy', 16: 'Love Apple'
    },
    playIn: 'Harvey Scales'
  },
  {
    name: 'SSW/Private',
    teams: {
      1: 'Ned Doheny', 2: 'Cosmic 1', 3: 'Willie Wright', 4: 'Female Species',
      5: 'Private Yacht', 6: 'Elyse Weinberg', 7: 'Kathy Heideman', 8: 'Shira Small',
      9: 'Acid Nightmares', 10: 'Catherine Howe', 11: 'Greenflow', 12: 'DR Hooker',
      13: 'Chuck Senrick', 14: 'Charlie Megira', 15: 'Jeff Cowell', 16: 'Archie James Cavanaugh'
    },
    playIn: 'Charles Brown'
  },
  {
    name: 'Other',
    teams: {
      1: 'Laraaji', 2: 'Blondie', 3: 'Margo', 4: 'Rupa',
      5: 'Lijadu Sisters', 6: 'Antena', 7: 'Technicolor', 8: 'Shirley Ann Lee',
      9: 'Wilburn Burchette', 10: 'Bobo Yeye', 11: 'Joanna Brouk', 12: 'Hamlet Minassian',
      13: 'Bernadette Carroll', 14: 'Branko Mataja', 15: 'Don Slepian', 16: 'Alejandro Bravo'
    },
    playIn: 'Super Djata Band'
  }
];

// Build teams array (same index order as bracket.html)
const ncaaOrder = [1,16, 8,9, 5,12, 4,13, 6,11, 3,14, 7,10, 2,15];
const teams = [];

regions.forEach(region => {
  ncaaOrder.forEach(seed => {
    teams.push({ name: region.teams[seed], seed, region: region.name });
  });
});

// Play-in teams (indices 64–71)
regions.forEach(region => {
  teams.push({ name: region.playIn,       seed: 16, region: region.name, playIn: true });
  teams.push({ name: region.teams[16],    seed: 16, region: region.name, playIn: true });
});

// ─── Seeded Win Probability ───────────────────────────────────────────────────
// Higher seed = better team = more likely to win
// Using historical NCAA upset rates as inspiration

function winProbability(seedA, seedB) {
  // Probability that seedA beats seedB
  // Lower seed number = stronger team
  const diff = seedB - seedA; // positive = A is favored
  // Sigmoid-ish curve: heavy favorite at large diff, ~50/50 at 0
  return 1 / (1 + Math.exp(-diff * 0.35));
}

function pickWinner(topIdx, botIdx) {
  const topTeam = teams[topIdx];
  const botTeam = teams[botIdx];
  const prob = winProbability(topTeam.seed, botTeam.seed);
  return Math.random() < prob ? topIdx : botIdx;
}

// ─── Build one random bracket ─────────────────────────────────────────────────

function buildRandomBracket() {
  // Play-in (4 games)
  const playIn = [];
  for (let i = 0; i < 4; i++) {
    const top = 64 + i * 2;
    const bot = 64 + i * 2 + 1;
    const winner = pickWinner(top, bot);
    playIn.push({ top, bot, winner,
      feedMatch: [0, 8, 16, 24][i],
      feedSlot: 'bot',
      region: ['Indie', 'Soul', 'SSW/Private', 'Other'][i]
    });
  }

  // Round 0 — 32 matches (8 per region)
  const r0 = [];
  for (let region = 0; region < 4; region++) {
    const base = region * 16;
    const matchups = [
      [base+0,  base+1],
      [base+2,  base+3],
      [base+4,  base+5],
      [base+6,  base+7],
      [base+8,  base+9],
      [base+10, base+11],
      [base+12, base+13],
      [base+14, base+15],
    ];
    matchups.forEach(([top, bot], mIdx) => {
      // Play-in winner feeds into the 16-seed (bot) slot of match 0 per region
      const actualBot = mIdx === 0 ? playIn[region].winner : bot;
      const winner = pickWinner(top, actualBot);
      r0.push({ top, bot: actualBot, winner });
    });
  }

  // Rounds 1–5 — each round halves the matchups
  const bracket = [r0];
  for (let round = 1; round <= 5; round++) {
    const prev = bracket[round - 1];
    const curr = [];
    for (let i = 0; i < prev.length; i += 2) {
      const top = prev[i].winner;
      const bot = prev[i + 1].winner;
      curr.push({ top, bot, winner: pickWinner(top, bot) });
    }
    bracket.push(curr);
  }

  return { bracket, playIn };
}

// ─── Name/Email generators ────────────────────────────────────────────────────

const firstNames = [
  'Alex','Jordan','Taylor','Morgan','Casey','Riley','Avery','Quinn','Blake','Drew',
  'Skyler','Reese','Cameron','Peyton','Dakota','Hayden','Rowan','Emery','Finley','Sage',
  'Jamie','Kendall','Logan','Parker','Spencer','Charlie','Frankie','Jesse','River','Remy',
  'Elliot','Harper','Monroe','Sutton','Brooks','Ellis','Marlowe','Shiloh','Wren','Zion',
  'James','Maria','Chen','Priya','Kofi','Amara','Lena','Nadia','Omar','Dmitri',
  'Isabelle','Marcus','Talia','Ezra','Simone','Caleb','Yasmin','Finn','Cleo','Andre'
];

const lastNames = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Moore',
  'Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Lee','Walker',
  'Hall','Allen','Young','King','Wright','Scott','Green','Baker','Adams','Nelson',
  'Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards',
  'Collins','Stewart','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey',
  'Rivera','Cooper','Richardson','Cox','Howard','Ward','Torres','Peterson','Gray','Ramirez',
  'Kim','Patel','Nguyen','Cohen','Williams','Santos','Ali','Chen','Okafor','Diaz'
];

const emailDomains = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
  'me.com','aol.com','protonmail.com','mail.com','live.com'
];

function randomName(index) {
  const first = firstNames[index % firstNames.length];
  const last = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  // Add a number suffix to ensure uniqueness
  const suffix = Math.floor(index / (firstNames.length * lastNames.length));
  return { first, last, display: suffix > 0 ? `${first} ${last} ${suffix + 1}` : `${first} ${last}` };
}

function randomEmail(first, last, index) {
  const domain = emailDomains[index % emailDomains.length];
  const num = index > 0 ? index : '';
  const formats = [
    `${first.toLowerCase()}.${last.toLowerCase()}${num}`,
    `${first.toLowerCase()}${last.toLowerCase()}${num}`,
    `${first.toLowerCase()[0]}${last.toLowerCase()}${num}`,
    `${last.toLowerCase()}.${first.toLowerCase()}${num}`,
  ];
  return `${formats[index % formats.length]}@${domain}`;
}

// ─── Generate SQL ─────────────────────────────────────────────────────────────

const NUM_USERS = 2000;
const lines = [];

lines.push('-- Numero March Sadness: 2000 simulated users');
lines.push('-- Generated: ' + new Date().toISOString());
lines.push('-- Run in Neon SQL Editor or any PostgreSQL client');
lines.push('');
lines.push('BEGIN;');
lines.push('');

// Optional: clear existing test data
lines.push('-- Uncomment the lines below to wipe existing data first:');
lines.push('-- DELETE FROM brackets;');
lines.push('-- DELETE FROM registrants;');
lines.push('');

const registrantValues = [];
const bracketValues = [];

// Track used emails to avoid duplicates
const usedEmails = new Set();

for (let i = 0; i < NUM_USERS; i++) {
  const { first, last, display } = randomName(i);
  let email = randomEmail(first, last, i);
  // Ensure uniqueness
  let attempt = 0;
  while (usedEmails.has(email)) {
    attempt++;
    email = randomEmail(first, last, i * 100 + attempt);
  }
  usedEmails.add(email);

  const name = display;
  const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();

  registrantValues.push(`('${name.replace(/'/g,"''")}', '${email}', '${createdAt}')`);

  const bracketData = buildRandomBracket();
  const bracketJson = JSON.stringify(bracketData).replace(/'/g, "''");
  bracketValues.push(`('${email}', '${name.replace(/'/g,"''")}', '${bracketJson}', true, '${createdAt}')`);
}

// Insert in batches of 100 to stay within SQL limits
const BATCH = 100;

lines.push(`-- Insert ${NUM_USERS} registrants`);
for (let i = 0; i < registrantValues.length; i += BATCH) {
  const batch = registrantValues.slice(i, i + BATCH);
  lines.push(`INSERT INTO registrants (name, email, created_at) VALUES`);
  lines.push(batch.join(',\n') + '');
  lines.push(`ON CONFLICT (email) DO NOTHING;`);
  lines.push('');
}

lines.push(`-- Insert ${NUM_USERS} brackets`);
for (let i = 0; i < bracketValues.length; i += BATCH) {
  const batch = bracketValues.slice(i, i + BATCH);
  lines.push(`INSERT INTO brackets (email, name, bracket_data, locked, created_at) VALUES`);
  lines.push(batch.join(',\n') + '');
  lines.push(`ON CONFLICT (email) DO UPDATE SET bracket_data = EXCLUDED.bracket_data, locked = EXCLUDED.locked;`);
  lines.push('');
}

lines.push('COMMIT;');
lines.push('');
lines.push(`-- Done! ${NUM_USERS} users inserted.`);

const sql = lines.join('\n');

// Write to file
const fs = require('fs');
fs.writeFileSync('seed_2000_users.sql', sql);

// Stats summary
console.log(`✅ Generated seed_2000_users.sql`);
console.log(`   ${NUM_USERS} unique users with randomized brackets`);
console.log(`   Bracket picks weighted by seed (1-seeds win ~95% vs 16-seeds)`);
console.log(`   File size: ${(sql.length / 1024 / 1024).toFixed(1)} MB`);
console.log(``);
console.log(`To use:`);
console.log(`  1. Run:  node seed_2000_users.js`);
console.log(`  2. Open your Neon dashboard → SQL Editor`);
console.log(`  3. Paste the contents of seed_2000_users.sql and click Run`);
