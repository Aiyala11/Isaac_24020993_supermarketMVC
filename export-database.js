const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');

    // Get all tables
    db.query("SHOW TABLES", (err, tables) => {
        if (err) {
            console.error('Error getting tables:', err);
            db.end();
            process.exit(1);
        }

        let sqlDump = `-- Database export for ${process.env.DB_NAME}\n`;
        sqlDump += `-- Exported on: ${new Date().toISOString()}\n\n`;
        sqlDump += `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};\n`;
        sqlDump += `USE ${process.env.DB_NAME};\n\n`;

        const tableNames = tables.map(t => Object.values(t)[0]);
        let processed = 0;

        tableNames.forEach(tableName => {
            // Get CREATE TABLE statement
            db.query(`SHOW CREATE TABLE ${tableName}`, (err, result) => {
                if (err) {
                    console.error(`Error getting CREATE statement for ${tableName}:`, err);
                } else {
                    sqlDump += `DROP TABLE IF EXISTS ${tableName};\n`;
                    sqlDump += result[0]['Create Table'] + ';\n\n';
                }

                // Get table data
                db.query(`SELECT * FROM ${tableName}`, (err, rows) => {
                    if (err) {
                        console.error(`Error getting data from ${tableName}:`, err);
                    } else if (rows.length > 0) {
                        sqlDump += `INSERT INTO ${tableName} VALUES\n`;
                        rows.forEach((row, index) => {
                            const values = Object.values(row).map(val => {
                                if (val === null) return 'NULL';
                                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                                if (val instanceof Date) return `'${val.toISOString()}'`;
                                return val;
                            });
                            sqlDump += `(${values.join(', ')})`;
                            sqlDump += index < rows.length - 1 ? ',\n' : ';\n\n';
                        });
                    }

                    processed++;
                    if (processed === tableNames.length) {
                        // Write to file
                        const filename = `${process.env.DB_NAME}_export.sql`;
                        fs.writeFileSync(filename, sqlDump);
                        console.log(`\n✓ Database exported successfully!`);
                        console.log(`✓ File saved as: ${filename}`);
                        console.log(`✓ File location: ${process.cwd()}\\${filename}`);
                        console.log(`\nYou can now submit this file with your project.`);
                        db.end();
                        process.exit(0);
                    }
                });
            });
        });
    });
});
