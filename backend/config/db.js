const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const Database = require('better-sqlite3');
const logger = require('../utils/logger');
require('dotenv').config();

let dbType = 'MYSQL'; // 'MYSQL' or 'SQLITE'
let mysqlPool = null;
let sqliteDb = null;

async function initDB() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || 'root';
  const dbName = process.env.DB_NAME || 'mentor_mentee';

  try {
    // Try connecting to MySQL
    mysqlPool = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const conn = await mysqlPool.getConnection();
    await conn.ping();
    conn.release();
    dbType = 'MYSQL';
    logger.info(`Successfully connected to MySQL database: ${dbName} at ${dbHost}`);
  } catch (mysqlErr) {
    logger.warn(`MySQL connection failed (${mysqlErr.message}). Falling back to SQLite database.`);
    
    // SQLite Fallback setup
    dbType = 'SQLITE';
    const dbFilePath = path.join(__dirname, '../../database/mentor_mentee.db');
    const dbDir = path.dirname(dbFilePath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const isNewDb = !fs.existsSync(dbFilePath);
    sqliteDb = new Database(dbFilePath);

    let tableExists = false;
    try {
      const check = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
      tableExists = !!check;
    } catch (_) {}

    if (isNewDb || !tableExists) {
      logger.info('Initializing SQLite schema and seed data...');
      try {
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const seedPath = path.join(__dirname, '../../database/seed.sql');

        let schemaSql = fs.readFileSync(schemaPath, 'utf8');
        let seedSql = fs.readFileSync(seedPath, 'utf8');

        // Adapt MySQL schema to SQLite
        schemaSql = schemaSql
          .replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;/g, ';')
          .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
          .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
          .replace(/TINYINT\(1\)/gi, 'INTEGER')
          .replace(/ENUM\([^)]+\)/gi, 'TEXT')
          .replace(/USE mentor_mentee;/gi, '')
          .replace(/CREATE DATABASE IF NOT EXISTS mentor_mentee;/gi, '');

        seedSql = seedSql.replace(/USE mentor_mentee;/gi, '');

        sqliteDb.exec(schemaSql);
        sqliteDb.exec(seedSql);
        logger.info('SQLite database schema & seed data initialized successfully!');
      } catch (seedErr) {
        logger.error('Error seeding SQLite database:', seedErr.message);
      }
    }

    try {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS student_subject_attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          semester INTEGER NOT NULL DEFAULT 5,
          subject_code TEXT NOT NULL,
          subject_name TEXT NOT NULL,
          conducted_sessions INTEGER NOT NULL DEFAULT 36,
          attended_sessions INTEGER NOT NULL DEFAULT 30,
          attendance_percentage REAL NOT NULL DEFAULT 83.33,
          remarks TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(student_id, semester, subject_code)
        );
      `);
    } catch (_) {}
  }
}

let initPromise = null;
function ensureDB() {
  if (!initPromise) {
    initPromise = initDB();
  }
  return initPromise;
}

async function query(sql, params = []) {
  await ensureDB();

  if (dbType === 'MYSQL') {
    try {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows;
    } catch (err) {
      logger.error(`MySQL query error: ${err.message}`, { sql, params });
      throw err;
    }
  } else {
    try {
      const trimmedSql = sql.trim();
      const isSelect = trimmedSql.toUpperCase().startsWith('SELECT') || trimmedSql.toUpperCase().startsWith('PRAGMA');
      
      if (isSelect) {
        const stmt = sqliteDb.prepare(sql);
        return stmt.all(...params);
      } else {
        const stmt = sqliteDb.prepare(sql);
        const info = stmt.run(...params);
        return {
          insertId: Number(info.lastInsertRowid),
          affectedRows: info.changes
        };
      }
    } catch (err) {
      logger.error(`SQLite query error: ${err.message}`, { sql, params });
      throw err;
    }
  }
}

// Immediately initialize DB on module require
ensureDB();

module.exports = {
  query,
  getDbType: () => dbType,
  ensureDB
};
