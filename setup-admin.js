const mysql = require('mysql2');
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
        return;
    }
    console.log('Connected to MySQL');

    // Update or insert admin user with specified credentials
    const email = 'peter@peter.com';
    const password = '123456';
    const username = 'peter';
    const address = 'Admin Address';
    const contact = '9876543210';

    // First, try to update existing admin
    db.query(
        `UPDATE users SET email = ?, password = SHA1(?), username = ?, address = ?, contact = ? WHERE role = 'admin' LIMIT 1`,
        [email, password, username, address, contact],
        (err, result) => {
            if (err) {
                console.error('Error updating admin:', err.message);
                db.end();
                process.exit(1);
                return;
            }

            if (result.affectedRows > 0) {
                console.log('✓ Admin user updated successfully!');
                console.log(`   Email: ${email}`);
                console.log(`   Password: ${password}`);
            } else {
                // If no admin exists, create one
                db.query(
                    `INSERT INTO users (username, email, password, address, contact, role) 
                     VALUES (?, ?, SHA1(?), ?, ?, 'admin')`,
                    [username, email, password, address, contact],
                    (err, result) => {
                        if (err) {
                            console.error('Error creating admin:', err.message);
                            db.end();
                            process.exit(1);
                            return;
                        }
                        console.log('✓ Admin user created successfully!');
                        console.log(`   Email: ${email}`);
                        console.log(`   Password: ${password}`);
                        db.end();
                        process.exit(0);
                    }
                );
            }

            db.end();
            process.exit(0);
        }
    );
});
