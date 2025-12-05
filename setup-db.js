const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

// Read the SQL file
const sql = fs.readFileSync('../C372_supermarketdb.sql', 'utf8');

// Create connection without database first
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

connection.connect((err) => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    console.log('Connected to MySQL');

    // Split SQL statements and execute them
    const statements = sql.split(';').filter(s => s.trim());
    let completed = 0;

    statements.forEach((statement, index) => {
        connection.query(statement, (err, results) => {
            if (err) {
                console.error(`Error executing statement ${index + 1}:`, err.message);
            } else {
                console.log(`✓ Statement ${index + 1} executed successfully`);
            }
            
            completed++;
            if (completed === statements.length) {
                console.log('\n✓ Database setup completed!');
                connection.end();
                process.exit(0);
            }
        });
    });
});
