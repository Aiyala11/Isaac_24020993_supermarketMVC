const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the SQL file
const sqlFilePath = path.join(__dirname, '..', 'C372_supermarketdb.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Create connection without database first
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
});

connection.connect((err) => {
    if (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');

    // Execute all SQL statements at once using multipleStatements
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error executing SQL:', err.message);
            connection.end();
            process.exit(1);
        } else {
            console.log('✓ Database setup completed successfully!');
        }
        
        connection.end();
        process.exit(0);
    });
});
