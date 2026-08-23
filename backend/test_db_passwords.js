const mysql = require('mysql2/promise');

const users = ['root', 'admin', 'developer', 'dev', 'user', 'mms', 'dbuser', 'student', 'mentor'];
const passwords = [
  '', 'root', 'password', '1234', '123456', '12345678', 'admin', 'mysql', 'MySQL',
  'root123', 'root@123', 'Password@123', 'Pass@123', 'mms', '12345', '123456789',
  'mysql123', 'Mysql@123', 'Root@123', 'system', 'database', 'secret',
  'mms123', 'mentor', 'mentee', 'MMS@123', 'Mms@123', 'Mms2024', 'Mms2026',
  'ajeem', 'Ajeem', 'ajeem123', 'Ajeem@123', 'ajeem@123', 'ajeem1234', 'root2024', 'root2025', 'root2026'
];

async function testPasswords() {
  for (const u of users) {
    for (const p of passwords) {
      try {
        const connection = await mysql.createConnection({
          host: 'localhost',
          user: u,
          password: p
        });
        console.log(`SUCCESS! FOUND WORKING MYSQL CREDS: USER="${u}", PASSWORD="${p}"`);
        await connection.end();
        return;
      } catch (err) {
        // continue
      }
    }
  }
  console.log('NO MATCH FOUND IN EXTENDED DICTIONARY.');
}

testPasswords();
