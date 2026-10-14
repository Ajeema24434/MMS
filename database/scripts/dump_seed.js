const fs = require('fs');
const path = require('path');
const Database = require(path.join(__dirname, '../../backend/node_modules/better-sqlite3'));
const db = new Database(path.join(__dirname, '../../database/mentor_mentee.db'));

const tables = ['users', 'divisions', 'mentors', 'batches', 'students', 'academic_records', 'activities', 'meetings', 'meeting_attendees', 'complaints', 'notifications'];
let sql = '-- Mentor-Mentee System Complete Seed Data\n-- Generated on ' + new Date().toISOString() + '\n\nPRAGMA foreign_keys = OFF;\n\n';

for (const tbl of tables) {
  sql += 'DELETE FROM ' + tbl + ';\n';
  const rows = db.prepare('SELECT * FROM ' + tbl).all();
  if (rows.length > 0) {
    const cols = Object.keys(rows[0]);
    for (const r of rows) {
      const vals = cols.map(c => {
        const v = r[c];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        return "'" + String(v).replace(/'/g, "''") + "'";
      });
      sql += 'INSERT INTO ' + tbl + ' (' + cols.join(', ') + ') VALUES (' + vals.join(', ') + ');\n';
    }
  }
  sql += '\n';
}

sql += 'PRAGMA foreign_keys = ON;\n';
fs.writeFileSync(path.join(__dirname, '../../database/seed.sql'), sql, 'utf8');
console.log('Successfully synchronized database/seed.sql with mentor_mentee.db (Lines: ' + sql.split('\n').length + ')');
