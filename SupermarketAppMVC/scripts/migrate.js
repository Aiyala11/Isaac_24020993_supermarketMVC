const fs = require('fs');
const path = require('path');
const db = require('../db');

const sqlPath = path.join(__dirname, '..', 'migrations', '001-create-cart-items.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

db.query(sql, (err, results) => {
  if (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
  console.log('Migration applied successfully.');
  process.exit(0);
});
