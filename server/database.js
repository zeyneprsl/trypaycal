const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

let pool;
let localDb;
let isPostgres = false;

// Determine which database to use
if (process.env.DATABASE_URL) {
  // Use PostgreSQL (Supabase)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  isPostgres = true;
  console.log('📡 Connected to PostgreSQL (Supabase)');
} else {
  // Use SQLite (Local)
  const dbPath = path.join(__dirname, 'subscriptions.db');
  localDb = new sqlite3.Database(dbPath);
  isPostgres = false;
  console.log('🏠 Connected to local SQLite database');
}

// Global helper to run queries
const db = {
  // Get single row
  get: (text, params) => {
    if (isPostgres) {
      const pgText = text.replace(/\?/g, (val, i, str) => {
        let count = 0;
        return text.substring(0, i + 1).split('?').length - 1;
      }).replace(/\?/g, (_, i) => `$${i + 1}`);
      
      // Simple ? to $n conversion for standard queries
      let counter = 1;
      const convertedText = text.replace(/\?/g, () => `$${counter++}`);
      
      return new Promise((resolve, reject) => {
        pool.query(convertedText, params, (err, res) => {
          if (err) reject(err);
          else resolve(res.rows[0]);
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        localDb.get(text, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  },

  // Get multiple rows
  all: (text, params) => {
    if (isPostgres) {
      let counter = 1;
      const convertedText = text.replace(/\?/g, () => `$${counter++}`);
      
      return new Promise((resolve, reject) => {
        pool.query(convertedText, params, (err, res) => {
          if (err) reject(err);
          else resolve(res.rows);
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        localDb.all(text, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  },

  // Run insert/update/delete
  run: (text, params) => {
    if (isPostgres) {
      let counter = 1;
      const convertedText = text.replace(/\?/g, () => `$${counter++}`);
      
      return new Promise((resolve, reject) => {
        pool.query(convertedText, params, function(err, res) {
          if (err) reject(err);
          else {
            // PostgreSQL doesn't have lastID in the same way, but we return the rows
            resolve({ 
              lastID: res.rows && res.rows[0] ? res.rows[0].id : null, 
              changes: res.rowCount 
            });
          }
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        localDb.run(text, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  }
};

const initialize = () => {
  if (isPostgres) return Promise.resolve(); // Tables already created via SQL Editor
  
  return new Promise((resolve, reject) => {
    localDb.serialize(() => {
      // Local SQLite initialization...
      resolve();
    });
  });
};

module.exports = {
  db, // Export the unified db object
  initialize,
  isPostgres
};
